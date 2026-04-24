import { Router } from 'express';
import { pool } from '../db';

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
  };
}

// GET /participantes
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query<DbRow>('SELECT * FROM participantes ORDER BY id ASC');
    res.json(result.rows.map(mapRow));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener participantes' });
  }
});

// POST /participantes
router.post('/', async (req, res) => {
  try {
    const { nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos } =
      req.body as ReturnType<typeof mapRow>;

    const result = await pool.query<DbRow>(
      `INSERT INTO participantes (nombre, email, edad, pais, modalidad, tecnologias, nivel, acepta_terminos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nombre, email, edad, pais, modalidad, tecnologias, nivel, aceptaTerminos],
    );

    res.status(201).json(mapRow(result.rows[0]));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear participante' });
  }
});

// PUT /participantes/:id
router.put('/:id', async (req, res) => {
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

// DELETE /participantes/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM participantes WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar participante' });
  }
});

// DELETE /participantes (resetear todos)
router.delete('/', async (_req, res) => {
  try {
    await pool.query('DELETE FROM participantes');
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al resetear participantes' });
  }
});

export default router;
