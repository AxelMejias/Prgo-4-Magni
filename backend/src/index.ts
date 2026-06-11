import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import participantesRouter from './routes/participantes';
import authRouter from './routes/auth';
import pagosRouter from './routes/pagos';
import { initDb } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRouter);
app.use('/participantes', participantesRouter);
app.use('/pagos', pagosRouter);

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error al inicializar la base de datos:', err);
    process.exit(1);
  });
