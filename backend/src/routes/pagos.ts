import { Router } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { pool } from '../db';

const router = Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

// POST /pagos/crear-preferencia
// Recibe { titulo, precio, comprador } y devuelve { checkout_url }
router.post('/crear-preferencia', authMiddleware, async (req, res) => {
  try {
    const { titulo, precio, comprador } = req.body as { titulo: string; precio: number; comprador?: string };

    if (!titulo || !precio) {
      res.status(400).json({ error: 'titulo y precio son requeridos' });
      return;
    }

    const BASE_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: titulo.toLowerCase().replace(/\s+/g, '-'),
            title: titulo,
            quantity: 1,
            unit_price: precio,
            currency_id: 'ARS',
          },
        ],
        external_reference: JSON.stringify({ titulo, precio, comprador: comprador ?? '' }),
        back_urls: {
          success: `${BASE_URL}/cursos/success`,
          failure: `${BASE_URL}/cursos/failure`,
          pending: `${BASE_URL}/cursos/pending`,
        },
        // auto_return solo funciona con HTTPS; usar ngrok en producción
        ...(BASE_URL.startsWith('https') && { auto_return: 'approved' as const }),
      },
    });

    const isSandbox = process.env.MP_SANDBOX === 'true';
    const checkout_url = isSandbox ? result.sandbox_init_point : result.init_point;

    res.json({ checkout_url });
  } catch (error) {
    const err = error as { message?: string; cause?: unknown; status?: number };
    console.error('Error MP:', err.message, err.cause);
    res.status(500).json({
      error: 'Error al crear preferencia de pago',
      detalle: err.message,
      causa: err.cause,
    });
  }
});

// POST /pagos/registrar-compra
router.post('/registrar-compra', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { curso, precio } = req.body as { curso: string; precio: number };
    const username = req.user!.username;
    if (!curso || !precio) {
      res.status(400).json({ error: 'curso y precio son requeridos' });
      return;
    }
    await pool.query(
      `INSERT INTO compras (username, curso, precio) VALUES ($1, $2, $3)`,
      [username, curso, precio],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar compra' });
  }
});

// GET /pagos/historial
router.get('/historial', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const username = req.user!.username;
    const result = await pool.query(
      `SELECT id, curso, precio, fecha FROM compras WHERE username = $1 ORDER BY fecha DESC`,
      [username],
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
