import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import participantesRouter from './routes/participantes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());

app.use('/participantes', participantesRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
