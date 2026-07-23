/**
 * Generic mutation endpoint — INSERT, UPDATE, DELETE, UPSERT.
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { getOperationalUserId, requireAuth } from '../middleware/auth.js';

const router = Router();

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

function buildWhere(filters, params) {
  if (!filters || !filters.length) return [];
  const clauses = [];
  for (const f of filters) {
    const idx = params.length + 1;
    if (f.type === 'eq') {
      params.push(f.value);
      clauses.push(`"${f.column}" = $${idx}`);
    } else if (f.type === 'in') {
      params.push(f.value);
      clauses.push(`"${f.column}" = ANY($${idx})`);
    } else if (f.type === 'neq') {
      params.push(f.value);
      clauses.push(`"${f.column}" != $${idx}`);
    }
  }
  return clauses;
}

// POST /api/mutate
router.post('/', requireAuth, async (req, res) => {
  const { table, operation, data, filters } = req.body || {};
  try {
    validateTable(table);
    const operationalUserId = req.user?.envAdmin ? await getOperationalUserId(req) : req.user?.userId;
    if (req.user?.envAdmin && !operationalUserId && ['insert', 'upsert'].includes(operation)) {
      return res.status(503).json({ data: null, error: { message: 'لا يوجد موظف نشط لتسجيل العملية' } });
    }
    const replaceEnvAdminId = (value) =>
      req.user?.envAdmin && value === req.user.userId ? operationalUserId : value;
    const normalizedData = Array.isArray(data)
      ? data.map((row) => normalizeRow(row, replaceEnvAdminId))
      : normalizeRow(data, replaceEnvAdminId);
    const normalizedFilters = (filters || []).map((filter) => ({
      ...filter,
      value: ['user_id', 'cashier_id'].includes(filter.column) && filter.type === 'eq'
        ? replaceEnvAdminId(filter.value)
        : filter.value,
    }));
    let result;

    if (operation === 'insert') {
      const rows = Array.isArray(normalizedData) ? normalizedData : [normalizedData];
      const inserted = [];
      for (const row of rows) {
        const keys = Object.keys(row);
        const vals = Object.values(row);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const { rows: r } = await pool.query(
          `INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) RETURNING *`,
          vals
        );
        inserted.push(...r);
      }
      result = { data: inserted.length === 1 ? inserted[0] : inserted, error: null };

    } else if (operation === 'update') {
      const keys = Object.keys(normalizedData);
      const vals = Object.values(normalizedData);
      const sets = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
      const params = [...vals];
      const whereClauses = buildWhere(normalizedFilters, params);
      let sql = `UPDATE "${table}" SET ${sets}`;
      if (whereClauses.length) sql += ` WHERE ${whereClauses.join(' AND ')}`;
      sql += ' RETURNING *';
      const { rows: r } = await pool.query(sql, params);
      result = { data: r, error: null };

    } else if (operation === 'delete') {
      const params = [];
      const whereClauses = buildWhere(normalizedFilters, params);
      let sql = `DELETE FROM "${table}"`;
      if (whereClauses.length) sql += ` WHERE ${whereClauses.join(' AND ')}`;
      sql += ' RETURNING *';
      const { rows: r } = await pool.query(sql, params);
      result = { data: r, error: null };

    } else if (operation === 'upsert') {
      const rows = Array.isArray(normalizedData) ? normalizedData : [normalizedData];
      const inserted = [];
      for (const row of rows) {
        const keys = Object.keys(row);
        const vals = Object.values(row);
        const cols = keys.map(k => `"${k}"`).join(', ');
        const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
        const updates = keys.filter(k => k !== 'id').map(k => `"${k}" = EXCLUDED."${k}"`).join(', ');
        const { rows: r } = await pool.query(
          `INSERT INTO "${table}" (${cols}) VALUES (${placeholders})
           ON CONFLICT (id) DO UPDATE SET ${updates} RETURNING *`,
          vals
        );
        inserted.push(...r);
      }
      result = { data: inserted.length === 1 ? inserted[0] : inserted, error: null };

    } else {
      return res.status(400).json({ error: 'Unknown operation' });
    }

    res.json(result);
  } catch (e) {
    console.error('mutate error', e.message);
    res.status(500).json({ data: null, error: { message: e.message } });
  }
});

function normalizeRow(row, replaceEnvAdminId) {
  if (!row || typeof row !== 'object') return row;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      key,
      ['user_id', 'cashier_id'].includes(key) ? replaceEnvAdminId(value) : value,
    ])
  );
}

export default router;
