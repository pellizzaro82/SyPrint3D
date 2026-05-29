import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { getPlanForUser } from '../services/planService.js';

function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET_NOT_CONFIGURED');
  }
  return secret;
}

function buildTokenPayload(user) {
  return {
    sub: String(user._id),
    email: user.email,
    role: user.isAdmin ? 'admin' : 'user',
  };
}

function parseBearerToken(authHeader) {
  const raw = String(authHeader || '');
  if (!raw.toLowerCase().startsWith('bearer ')) return '';
  return raw.slice(7).trim();
}

export function verifyAuth(req, res, next) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) {
    return res.status(401).json({ message: 'Token ausente.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.auth = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: 'Token invalido ou expirado.' });
  }
}

export async function login(req, res) {
  const emailInput = String(req.body?.email || '').trim().toLowerCase();
  const passwordInput = String(req.body?.senha || req.body?.password || '');

  if (!emailInput || !passwordInput) {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  const user = await User.findOne({ email: emailInput });

  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const passwordMatches = await bcrypt.compare(passwordInput, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciais invalidas.' });
  }

  const now = new Date();
  user.lastLogin = now;
  await user.save();

  let token;
  try {
    token = jwt.sign(buildTokenPayload(user), getJwtSecret(), {
      expiresIn: '8h',
    });
  } catch {
    return res.status(500).json({ message: 'Configuracao de autenticacao ausente.' });
  }

  const plan = getPlanForUser(user);

  return res.json({
    token,
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      isActive: Boolean(user.isActive),
      expirePlan: user.expirePlan,
      payment_status: user.payment_status,
      planCode: plan.code,
      planName: plan.name,
      whatsapp: user.whatsapp,
      lastLogin: user.lastLogin,
    },
  });
}

export async function me(req, res) {
  const userId = String(req.auth?.sub || '').trim();
  if (!userId) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  const user = await User.findById(userId).lean();
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  const plan = getPlanForUser(user);

  return res.json({
    user: {
      id: String(user._id),
      nome: user.nome,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      isActive: Boolean(user.isActive),
      expirePlan: user.expirePlan,
      payment_status: user.payment_status,
      planCode: plan.code,
      planName: plan.name,
      whatsapp: user.whatsapp,
      lastLogin: user.lastLogin,
    },
  });
}
