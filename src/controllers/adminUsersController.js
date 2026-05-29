import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';
import { getPlanForUser, isValidPlanCode } from '../services/planService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function normalizeBool(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  const text = String(value || '').trim().toLowerCase();
  if (!text) return fallback;
  return ['1', 'true', 'sim', 'yes', 'on'].includes(text);
}

function sanitizeText(value, max = 120) {
  return String(value || '').trim().slice(0, max);
}

function toResponseUser(user) {
  const plan = getPlanForUser(user);
  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    isActive: Boolean(user.isActive),
    payment_status: user.payment_status,
    expirePlan: user.expirePlan,
    whatsapp: user.whatsapp,
    lastLogin: user.lastLogin,
    planCode: plan.code,
    planName: plan.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const listAdminUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users.map((user) => toResponseUser(user)));
});

export const createAdminUser = asyncHandler(async (req, res) => {
  const nome = sanitizeText(req.body?.nome, 120);
  const email = sanitizeText(req.body?.email, 180).toLowerCase();
  const senha = String(req.body?.senha || '');

  if (!nome || !email || !senha) {
    return res.status(400).json({ message: 'Nome, e-mail e senha sao obrigatorios.' });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return res.status(409).json({ message: 'Ja existe usuario com este e-mail.' });
  }

  const planCodeInput = String(req.body?.planCode || '').trim().toLowerCase();
  const planCode = isValidPlanCode(planCodeInput) ? planCodeInput : 'basic';
  const isActive = normalizeBool(req.body?.isActive, true);
  const paymentStatus = sanitizeText(req.body?.payment_status || 'active', 30) || 'active';

  const now = new Date();
  const expireInput = String(req.body?.expirePlan || '').trim();
  const parsedExpire = expireInput ? new Date(expireInput) : null;
  const expirePlan = parsedExpire && !Number.isNaN(parsedExpire.getTime())
    ? parsedExpire
    : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  const passwordHash = await bcrypt.hash(senha, 10);

  const created = await User.create({
    nome,
    email,
    passwordHash,
    isAdmin: false,
    isActive,
    payment_status: paymentStatus,
    expirePlan,
    planCode,
    whatsapp: sanitizeText(req.body?.whatsapp, 40),
  });

  res.status(201).json(toResponseUser(created.toObject()));
});

export const updateAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado.' });
  }

  const nome = sanitizeText(req.body?.nome, 120);
  const whatsapp = sanitizeText(req.body?.whatsapp, 40);
  const paymentStatus = sanitizeText(req.body?.payment_status, 30);
  const planCodeInput = String(req.body?.planCode || '').trim().toLowerCase();

  if (nome) user.nome = nome;
  if (typeof req.body?.whatsapp !== 'undefined') user.whatsapp = whatsapp;
  if (typeof req.body?.isActive !== 'undefined') user.isActive = normalizeBool(req.body?.isActive, user.isActive);
  if (paymentStatus) user.payment_status = paymentStatus;
  if (isValidPlanCode(planCodeInput)) user.planCode = planCodeInput;

  if (req.body?.expirePlan) {
    const parsedExpire = new Date(req.body.expirePlan);
    if (!Number.isNaN(parsedExpire.getTime())) {
      user.expirePlan = parsedExpire;
    }
  }

  const senha = String(req.body?.senha || '');
  if (senha.trim()) {
    user.passwordHash = await bcrypt.hash(senha.trim(), 10);
  }

  await user.save();
  res.json(toResponseUser(user.toObject()));
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean();
  if (!user) {
    return res.status(404).json({ message: 'Usuario nao encontrado.' });
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});
