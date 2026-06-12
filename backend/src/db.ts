import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// NeonDB via connection string con SSL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function initDb() {
  // Con NeonDB la base ya existe — solo creamos tablas y seed

  // Tabla participantes
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS participantes (
        id              SERIAL PRIMARY KEY,
        nombre          VARCHAR(100)  NOT NULL,
        email           VARCHAR(150)  NOT NULL,
        edad            INTEGER       NOT NULL,
        pais            VARCHAR(100)  NOT NULL,
        modalidad       VARCHAR(50)   NOT NULL,
        tecnologias     TEXT[]        NOT NULL DEFAULT '{}',
        nivel           VARCHAR(50)   NOT NULL,
        acepta_terminos BOOLEAN       NOT NULL DEFAULT false,
        activo          BOOLEAN       NOT NULL DEFAULT true
      )
    `);
    await pool.query(`
      ALTER TABLE participantes ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true
    `);
    console.log('Tabla "participantes" lista.');
  } catch (err) {
    console.error('No se pudo crear la tabla "participantes":', (err as Error).message);
    throw err;
  }

  // Tabla compras
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS compras (
        id       SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        curso    VARCHAR(200) NOT NULL,
        precio   INTEGER      NOT NULL,
        fecha    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla "compras" lista.');
  } catch (err) {
    console.error('No se pudo crear la tabla "compras":', (err as Error).message);
    throw err;
  }

  // Tabla usuarios_db
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios_db (
        id       SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        rol      VARCHAR(50)  NOT NULL DEFAULT 'CONSULTA'
      )
    `);
    console.log('Tabla "usuarios_db" lista.');

    // Seed: crear usuarios por defecto si no hay ninguno
    const count = await pool.query('SELECT COUNT(*) FROM usuarios_db');
    if (parseInt(count.rows[0].count) === 0) {
      const adminHash = await bcrypt.hash('admin123', 10);
      const consultaHash = await bcrypt.hash('consulta123', 10);
      await pool.query(
        `INSERT INTO usuarios_db (username, password, rol) VALUES ($1, $2, 'ADMIN'), ($3, $4, 'CONSULTA')`,
        ['admin', adminHash, 'consulta', consultaHash],
      );
      console.log('Usuarios por defecto creados: admin (admin123) / consulta (consulta123)');
    }
  } catch (err) {
    console.error('No se pudo crear la tabla "usuarios_db":', (err as Error).message);
    throw err;
  }
}
