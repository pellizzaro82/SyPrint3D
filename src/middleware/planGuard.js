import { Client } from '../models/Client.js';
import { Material } from '../models/Material.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { getCurrentMonthRange, getPlanForUser, hasActiveAccess, hasPlanPermission } from '../services/planService.js';
import { getRequestUserId } from '../utils/requestUser.js';

async function loadCurrentUser(req) {
  if (req.currentUser) return req.currentUser;

  const userId = String(req.auth?.sub || '').trim();
  if (!userId) return null;

  const user = await User.findById(userId).lean();
  req.currentUser = user || null;
  return req.currentUser;
}

export async function requireAdmin(req, res, next) {
  const user = await loadCurrentUser(req);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Acesso restrito ao administrador.' });
  }
  return next();
}

export async function requireActivePlanAccess(req, res, next) {
  const user = await loadCurrentUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  if (!hasActiveAccess(user)) {
    return res.status(403).json({
      message: 'Seu plano esta inativo ou expirado. Atualize sua assinatura para continuar.',
      code: 'PLAN_INACTIVE',
    });
  }

  return next();
}

export function enforcePlanPermission(permissionKey) {
  return async (req, res, next) => {
    const user = await loadCurrentUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Sessao invalida.' });
    }

    if (!hasActiveAccess(user)) {
      return res.status(403).json({
        message: 'Seu plano esta inativo ou expirado. Atualize sua assinatura para continuar.',
        code: 'PLAN_INACTIVE',
      });
    }

    if (!hasPlanPermission(user, permissionKey)) {
      return res.status(403).json({
        message: 'Seu plano atual nao possui permissao para acessar este modulo.',
        code: 'PLAN_PERMISSION_DENIED',
        permission: permissionKey,
      });
    }

    return next();
  };
}

export function enforcePlanLimit(resourceKey) {
  return async (req, res, next) => {
    const user = await loadCurrentUser(req);
    const userId = getRequestUserId(req);
    if (!user) {
      return res.status(401).json({ message: 'Sessao invalida.' });
    }
    if (!userId) {
      return res.status(401).json({ message: 'Sessao invalida.' });
    }

    if (!hasActiveAccess(user)) {
      return res.status(403).json({
        message: 'Seu plano esta inativo ou expirado. Atualize sua assinatura para continuar.',
        code: 'PLAN_INACTIVE',
      });
    }

    const plan = getPlanForUser(user);
    const limits = plan?.limits || {};

    const rejectLimit = (limitValue) =>
      res.status(403).json({
        message: `Limite do plano ${plan.name} atingido para este recurso (${limitValue}).`,
        code: 'PLAN_LIMIT_REACHED',
        resource: resourceKey,
      });

    if (resourceKey === 'orders_month') {
      const limit = limits.ordersPerMonth;
      if (!limit) return next();

      const { start, end } = getCurrentMonthRange();
      const total = await Order.countDocuments({ ownerUserId: userId, createdAt: { $gte: start, $lt: end } });
      if (total >= limit) return rejectLimit(limit);
      return next();
    }

    if (resourceKey === 'clients_total') {
      const limit = limits.clientsTotal;
      if (!limit) return next();

      const total = await Client.countDocuments({ ownerUserId: userId });
      if (total >= limit) return rejectLimit(limit);
      return next();
    }

    if (resourceKey === 'products_total') {
      const limit = limits.productsTotal;
      if (!limit) return next();

      const total = await Product.countDocuments({ ownerUserId: userId });
      if (total >= limit) return rejectLimit(limit);
      return next();
    }

    if (resourceKey === 'materials_total') {
      const limit = limits.materialsTotal;
      if (!limit) return next();

      const total = await Material.countDocuments({ ownerUserId: userId });
      if (total >= limit) return rejectLimit(limit);
      return next();
    }

    return next();
  };
}
