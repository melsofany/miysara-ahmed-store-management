import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'miysara-secret-change-in-prod';

export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requirePermission(permission) {
  return async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT 1
           FROM profiles p
           JOIN role_permissions rp ON rp.role_id = p.role_id
           JOIN permissions perm ON perm.id = rp.permission_id
          WHERE p.id = $1 AND p.is_active = true AND perm.key = $2
          LIMIT 1`,
        [req.user.userId, permission]
      );
      if (!rows[0]) return res.status(403).json({ error: 'ليس لديك صلاحية لهذه العملية' });
      next();
    } catch (e) {
      console.error('permission check error', e.message);
      res.status(500).json({ error: 'خطأ في الخادم' });
    }
  };
}

export { JWT_SECRET };
