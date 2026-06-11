import { Router } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

// POST /pagos/crear-preferencia
// Recibe { titulo, precio } y devuelve { init_point }
router.post('/crear-preferencia', authMiddleware, async (req, res) => {
  try {
    const { titulo, precio } = req.body as { titulo: string; precio: number };

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

export default router;
