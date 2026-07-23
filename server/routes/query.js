/**
 * Generic query endpoint — supports table reads with joins,
 * filters, ordering, and limiting, mimicking Supabase PostgREST behaviour.
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Relationship map: defines how to resolve "alias:table(*)" selects
const RELATIONS = {
  profiles: {
    role: { table: 'roles', localKey: 'role_id', foreignKey: 'id', type: 'one' },
  },
  role_permissions: {
    permission: { table: 'permissions', localKey: 'permission_id', foreignKey: 'id', type: 'one' },
  },
  products: {
    variants: { table: 'product_variants', localKey: 'id', foreignKey: 'product_id', type: 'many' },
    category: { table: 'categories', localKey: 'category_id', foreignKey: 'id', type: 'one' },
    season: { table: 'seasons', localKey: 'season_id', foreignKey: 'id', type: 'one' },
    supplier: { table: 'suppliers', localKey: 'supplier_id', foreignKey: 'id', type: 'one' },
    manufacturer: { table: 'manufacturers', localKey: 'manufacturer_id', foreignKey: 'id', type: 'one' },
  },
  product_variants: {
    product: { table: 'products', localKey: 'product_id', foreignKey: 'id', type: 'one' },
    size: { table: 'sizes', localKey: 'size_id', foreignKey: 'id', type: 'one' },
    color: { table: 'colors', localKey: 'color_id', foreignKey: 'id', type: 'one' },
  },
  inventory: {
    variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
    product_variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
  },
  stock_movements: {
    variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
    product_variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
    user: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', type: 'one' },
  },
  invoices: {
    pos_location: { table: 'pos_locations', localKey: 'pos_location_id', foreignKey: 'id', type: 'one' },
    cashier: { table: 'profiles', localKey: 'cashier_id', foreignKey: 'id', type: 'one' },
    payments: { table: 'payments', localKey: 'id', foreignKey: 'invoice_id', type: 'many' },
    invoice_items: { table: 'invoice_items', localKey: 'id', foreignKey: 'invoice_id', type: 'many' },
  },
  invoice_items: {
    product_variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
    invoice_return_items: { table: 'invoice_return_items', localKey: 'id', foreignKey: 'invoice_item_id', type: 'many' },
  },
  invoice_returns: {
    original_invoice: { table: 'invoices', localKey: 'original_invoice_id', foreignKey: 'id', type: 'one' },
    user: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', type: 'one' },
    invoice_return_items: { table: 'invoice_return_items', localKey: 'id', foreignKey: 'return_id', type: 'many' },
  },
  invoice_return_items: {
    invoice_item: { table: 'invoice_items', localKey: 'invoice_item_id', foreignKey: 'id', type: 'one' },
    product_variant: { table: 'product_variants', localKey: 'product_variant_id', foreignKey: 'id', type: 'one' },
  },
  cash_shifts: {
    user: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', type: 'one' },
    pos_location: { table: 'pos_locations', localKey: 'pos_location_id', foreignKey: 'id', type: 'one' },
  },
  pos_locations: {
    warehouse: { table: 'warehouses', localKey: 'warehouse_id', foreignKey: 'id', type: 'one' },
  },
  user_pos_locations: {
    pos_location: { table: 'pos_locations', localKey: 'pos_location_id', foreignKey: 'id', type: 'one' },
    profile: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', type: 'one' },
  },
  audit_logs: {
    user: { table: 'profiles', localKey: 'user_id', foreignKey: 'id', type: 'one' },
  },
};

// Safe table allow-list
const ALLOWED_TABLES = new Set([
  'companies','roles','permissions','role_permissions','profiles',
  'categories','suppliers','manufacturers','seasons','sizes','colors',
  'warehouses','pos_locations','user_pos_locations','user_warehouses',
  'products','product_variants','inventory','stock_movements',
  'cash_shifts','invoices','invoice_items','payments',
  'invoice_returns','invoice_return_items','audit_logs',
]);

function validateTable(name) {
  if (!ALLOWED_TABLES.has(name)) throw new Error(`Table not allowed: ${name}`);
}

/**
 * Parse Supabase-style select string.
 * e.g. "*, role:roles(*)" → { columns: ['*'], joins: [{alias:'role', table:'roles', cols:'*'}] }
 */
function parseSelect(selectStr) {
  const parts = selectStr.split(',').map(s => s.trim()).filter(Boolean);
  const joins = [];
  const columns = [];
  for (const part of parts) {
    // "alias:table(cols)" or "table(cols)"
    const m = part.match(/^(?:(\w+):)?(\w+)\(([^)]*)\)$/);
    if (m) {
      const [, alias, table, cols] = m;
      joins.push({ alias: alias || table, table, cols: cols || '*' });
    } else {
      columns.push(part);
    }
  }
  return { columns: columns.length ? columns : ['*'], joins };
}

/**
 * Build WHERE clause from filter descriptors.
 */
function buildWhere(filters, params) {
  if (!filters || !filters.length) return [];
  const clauses = [];
  for (const f of filters) {
    const idx = () => params.length + 1;
    switch (f.type) {
      case 'eq':
        params.push(f.value);
        clauses.push(`"${f.column}" = $${idx()}`);
        break;
      case 'neq':
        params.push(f.value);
        clauses.push(`"${f.column}" != $${idx()}`);
        break;
      case 'gte':
        params.push(f.value);
        clauses.push(`"${f.column}" >= $${idx()}`);
        break;
      case 'lte':
        params.push(f.value);
        clauses.push(`"${f.column}" <= $${idx()}`);
        break;
      case 'ilike':
        params.push(f.value);
        clauses.push(`"${f.column}" ILIKE $${idx()}`);
        break;
      case 'in':
        params.push(f.value);
        clauses.push(`"${f.column}" = ANY($${idx()})`);
        break;
      case 'is':
        if (f.value === null) clauses.push(`"${f.column}" IS NULL`);
        else { params.push(f.value); clauses.push(`"${f.column}" IS $${idx()}`); }
        break;
      case 'or': {
        // "col.op.val,col.op.val"
        const orParts = f.value.split(',').map(p => p.trim());
        const ors = orParts.map(p => {
          const dotIdx = p.indexOf('.');
          const col = p.slice(0, dotIdx);
          const rest = p.slice(dotIdx + 1);
          const opDot = rest.indexOf('.');
          const op = rest.slice(0, opDot);
          const val = rest.slice(opDot + 1);
          const pi = params.length + 1;
          params.push(val);
          if (op === 'ilike') return `"${col}" ILIKE $${pi}`;
          if (op === 'eq') return `"${col}" = $${pi}`;
          return `"${col}" ILIKE $${pi}`;
        });
        if (ors.length) clauses.push(`(${ors.join(' OR ')})`);
        break;
      }
    }
  }
  return clauses;
}

async function resolveJoins(rows, table, joins) {
  const relations = RELATIONS[table] || {};
  for (const join of joins) {
    const rel = relations[join.alias];
    if (!rel) continue;
    try {
      validateTable(rel.table);
    } catch {
      continue;
    }
    const colSelect = join.cols === '*' ? '*' : join.cols.split(',').map(c => `"${c.trim()}"`).join(', ');
    if (rel.type === 'one') {
      const ids = [...new Set(rows.map(r => r[rel.localKey]).filter(v => v != null))];
      if (!ids.length) { rows.forEach(r => { r[join.alias] = null; }); continue; }
      const { rows: related } = await pool.query(
        `SELECT ${colSelect} FROM "${rel.table}" WHERE "${rel.foreignKey}" = ANY($1)`,
        [ids]
      );
      const map = new Map(related.map(r => [r[rel.foreignKey], r]));
      rows.forEach(r => { r[join.alias] = map.get(r[rel.localKey]) ?? null; });
    } else {
      // many
      const ids = [...new Set(rows.map(r => r[rel.localKey]).filter(v => v != null))];
      if (!ids.length) { rows.forEach(r => { r[join.alias] = []; }); continue; }
      const { rows: related } = await pool.query(
        `SELECT ${colSelect} FROM "${rel.table}" WHERE "${rel.foreignKey}" = ANY($1)`,
        [ids]
      );
      const map = new Map();
      for (const r of related) {
        const k = r[rel.foreignKey];
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(r);
      }
      rows.forEach(r => { r[join.alias] = map.get(r[rel.localKey]) ?? []; });
    }
  }
}

// POST /api/query
router.post('/', requireAuth, async (req, res) => {
  const { table, select, filters, order, limit, single } = req.body || {};
  try {
    validateTable(table);
    const { columns, joins } = parseSelect(select || '*');
    const params = [];
    const whereClauses = buildWhere(filters, params);

    const colStr = columns.includes('*') ? '*' : columns.map(c => `"${c}"`).join(', ');
    let sql = `SELECT ${colStr} FROM "${table}"`;
    if (whereClauses.length) sql += ` WHERE ${whereClauses.join(' AND ')}`;
    if (order && order.length) {
      sql += ` ORDER BY ${order.map(o => `"${o.column}" ${o.ascending ? 'ASC' : 'DESC'}`).join(', ')}`;
    }
    if (limit) sql += ` LIMIT ${parseInt(limit, 10)}`;

    const { rows } = await pool.query(sql, params);

    if (joins.length && rows.length) {
      await resolveJoins(rows, table, joins);
    }

    if (single) {
      return res.json({ data: rows[0] ?? null, error: null });
    }
    res.json({ data: rows, error: null });
  } catch (e) {
    console.error('query error', e.message);
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

export default router;
