import { Router } from 'express';

import { login, me, verifyAuth } from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.get('/me', verifyAuth, me);

export { authRoutes };
