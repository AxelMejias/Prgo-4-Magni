import { Router } from 'express';
import { pool } from '../db';
import { authMiddleware, adminRequired, type AuthRequest } from '../middleware/auth';

const router = Router();

type DbRow = {
  id: number;
  nombre: string;
  email: string;
  edad: number;
  pais: string;
  modalidad: string;
  tecnologias: string[];
  nivel: string;
  acepta_terminos: boolean;
  activo: boolean;
};

function mapRow(row: DbRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    edad: row.edad,
    pais: row.pais,
    modalidad: row.modalidad,
    tecnologias: row.tecnologias,
    nivel: row.nivel,
    aceptaTerminos: row.acepta_terminos,
    activo: row.activo,
  };
}

// GET /participantes - requiere autenticación (ADMIN y CONSULTA)
router.get('/', authMiddleware, async (_req, res) => {
  try {
    const result = await pool.query<DbRow>('SELECT * FROM participantes ORDER BY id ASC');
    res.json(result.rows.map(mapRow));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener participantes' });
  }
});

// POST /participantes - solo ADMIN
router.post('/', authMiddleware, adminRequired, async (req: AuthRequest, res) => {
  try {
    const { nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos } =
      req.body as ReturnType<typeof mapRow>;

    const result = await pool.query<DbRow>(
      `INSERT INTO participantes (nombre, email, edad, pais, modalidad, tecnologias, nivel, acepta_terminos, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *`,
      [nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos],
    );

    res.status(201).json(mapRow(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear participante' });
  }
});

// PUT /participantes/:id - solo ADMIN
router.put('/:id', authMiddleware, adminRequired, async (req: AuthRequest, res) => {
  try {
    const { nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos } =
      req.body as ReturnType<typeof mapRow>;

    const result = await pool.query<DbRow>(
      `UPDATE participantes
       SET nombre=$1, email=$2, edad=$3, pais=$4, modalidad=$5, tecnologias=$6, nivel=$7, acepta_terminos=$8
       WHERE id=$9
       RETURNING *`,
      [nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos, req.params.id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Participante no encontrado' });
      return;
    }

    res.json(mapRow(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al editar participante' });
  }
});

// DELETE /participantes/:id - baja lógica (activo=false), solo ADMIN
router.delete('/:id', authMiddleware, adminRequired, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query<DbRow>(
      'UPDATE participantes SET activo = false WHERE id = $1 RETURNING *',
      [req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Participante no encontrado' });
      return;
    }
    res.json(mapRow(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al dar de baja al participante' });
  }
});

// PATCH /participantes/:id/reactivar - reactivar participante, solo ADMIN
router.patch('/:id/reactivar', authMiddleware, adminRequired, async (req: AuthRequest, res) => {
  try {
    const result = await pool.query<DbRow>(
      'UPDATE participantes SET activo = true WHERE id = $1 RETURNING *',
      [req.params.id],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Participante no encontrado' });
      return;
    }
    res.json(mapRow(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reactivar participante' });
  }
});

// DELETE /participantes - resetear todos (eliminación física), solo ADMIN
router.delete('/', authMiddleware, adminRequired, async (_req, res) => {
  try {
    await pool.query('DELETE FROM participantes');
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear participantes' });
  }
});

export default router;
