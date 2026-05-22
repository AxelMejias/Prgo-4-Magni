import { Pool, Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'tp6m_db',
} = process.env;

export const pool = new Pool({
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: Number(DB_PORT),
  database: DB_NAME,
});

export async function initDb() {
  // Paso 1: conectar a la DB "postgres" (la default del sistema) y crear tp6m_db si no existe
  const adminClient = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: Number(DB_PORT),
    database: 'postgres',
  });

  try {
    await adminClient.connect();
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME],
    );
    if (res.rowCount === 0) {
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✔ Base de datos "${DB_NAME}" creada.`);
    } else {
      console.log(`✔ Base de datos "${DB_NAME}" ya existe.`);
    }
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`\n⚠ No se pudo conectar a PostgreSQL.`);
    console.error(`  Usuario: ${DB_USER} | Host: ${DB_HOST}:${DB_PORT}`);
    console.error(`  Error: ${msg}`);
    console.error(`  Verificá que PostgreSQL esté corriendo y que DB_USER/DB_PASSWORD sean correctos en backend/.env\n`);
    throw err;
  } finally {
    await adminClient.end();
  }

  // Paso 2: crear la tabla si no existe
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
        acepta_terminos BOOLEAN       NOT NULL DEFAULT false
      )
    `);
    console.log(`✔ Tabla "participantes" lista.`);
  } catch (err) {
    console.error(`\n⚠ No se pudo crear la tabla "participantes":`, (err as Error).message, '\n');
    throw err;
  }
}
