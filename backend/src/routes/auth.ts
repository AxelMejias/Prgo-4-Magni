import { Router } from 'express';
import { pool } from '../db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'tp7m_jwt_secret_2024';

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };

    if (!username || !password) {
      res.status(400).json({ error: 'Usuario y contraseña requeridos' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM usuarios_db WHERE username = $1',
      [username],
    );
    const user = result.rows[0];

    if (!user) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' },
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, rol: user.rol },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

export default router;
