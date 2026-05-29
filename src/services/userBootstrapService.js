import bcrypt from 'bcryptjs';

import { User } from '../models/User.js';

const DEFAULT_ADMIN_NAME = 'Administrador';
const DEFAULT_ADMIN_WHATSAPP = '';

export async function ensureDefaultAdminUser() {
  const adminEmail = String(process.env.AUTH_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.AUTH_PASSWORD || '');

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await User.findOne({ email: adminEmail }).lean();

  if (existing) return;

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const now = new Date();
  const expirePlan = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  await User.create({
    nome: process.env.AUTH_NAME || DEFAULT_ADMIN_NAME,
    email: adminEmail,
    passwordHash,
    isActive: true,
    isAdmin: true,
    expirePlan,
    payment_status: 'active',
    whatsapp: process.env.AUTH_WHATSAPP || DEFAULT_ADMIN_WHATSAPP,
  });

  console.log(`Usuario admin inicial criado: ${adminEmail}`);
}
