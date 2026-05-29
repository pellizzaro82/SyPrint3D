import cors from 'cors';
import compression from 'compression';
import express from 'express';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { login, me, verifyAuth } from './controllers/authController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { routes } from './routes/index.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(rootDir, 'public')));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SyPrint3D API' });
});

app.post('/api/login', loginLimiter, login);
app.get('/api/me', verifyAuth, me);
app.post('/api/auth/login', loginLimiter, login);
app.get('/api/auth/me', verifyAuth, me);

app.use('/api', verifyAuth, routes);
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
