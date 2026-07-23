import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth, JWT_SECRET } from '../middleware/auth.js';

const router = Router();
const JWT_EXPIRES = '7d';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'البريد والكلمة مطلوبان' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM auth_credentials WHERE email = $1',
      [email.toLowerCase()]
    );
    if (!rows[0]) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    const token = jwt.sign(
      { userId: rows[0].profile_id, email: rows[0].email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );
    res.json({ token, userId: rows[0].profile_id });
  } catch (e) {
    console.error('login error', e.message);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, fullName, companyId } = req.body || {};
  if (!email || !password || !fullName)
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      'SELECT id FROM auth_credentials WHERE email = $1',
      [email.toLowerCase()]
    );
    if (existing[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    // Get first company if not provided
    let cId = companyId || null;
    if (!cId) {
      const { rows: comps } = await client.query('SELECT id FROM companies LIMIT 1');
      cId = comps[0]?.id || null;
    }
    const { rows: prof } = await client.query(
      `INSERT INTO profiles (email, full_name, role_id, company_id, can_view_cost, is_active, full_name_ar, phone)
       VALUES ($1, $2, NULL, $3, false, true, NULL, NULL) RETURNING id`,
      [email.toLowerCase(), fullName, cId]
    );
    const profileId = prof[0].id;
    const hash = await bcrypt.hash(password, 12);
    await client.query(
      'INSERT INTO auth_credentials (email, password_hash, profile_id) VALUES ($1, $2, $3)',
      [email.toLowerCase(), hash, profileId]
    );
    await client.query('COMMIT');
    res.json({ userId: profileId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('signup error', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ userId: req.user.userId, email: req.user.email });
});

export default router;
