import { Client } from '../models/Client.js';
import { Material } from '../models/Material.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { getCurrentMonthRange, getPlanForUser, isValidPlanCode, listSelectablePlans } from '../services/planService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRequestUserId } from '../utils/requestUser.js';

async function loadCurrentUser(req) {
  const userId = String(req.auth?.sub || '').trim();
  if (!userId) return null;
  return User.findById(userId);
}

async function buildUsageSummary(userId) {
  const { start, end } = getCurrentMonthRange();
  const [ordersMonth, clientsTotal, productsTotal, materialsTotal] = await Promise.all([
    Order.countDocuments({ ownerUserId: userId, createdAt: { $gte: start, $lt: end } }),
    Client.countDocuments({ ownerUserId: userId }),
    Product.countDocuments({ ownerUserId: userId }),
    Material.countDocuments({ ownerUserId: userId }),
  ]);

  return {
    ordersPerMonth: ordersMonth,
    clientsTotal,
    productsTotal,
    materialsTotal,
  };
}

function projectUser(user) {
  const plan = getPlanForUser(user);
  return {
    id: String(user._id),
    nome: user.nome,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    isActive: Boolean(user.isActive),
    payment_status: user.payment_status,
    expirePlan: user.expirePlan,
    planCode: plan.code,
    planName: plan.name,
  };
}

export const getMyPlan = asyncHandler(async (req, res) => {
  const user = await loadCurrentUser(req);
  const userId = getRequestUserId(req);
  if (!user) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  const usage = await buildUsageSummary(userId);
  const currentPlan = getPlanForUser(user);

  res.json({
    user: projectUser(user),
    currentPlan,
    usage,
    plans: listSelectablePlans(),
  });
});

export const updateMyPlan = asyncHandler(async (req, res) => {
  const user = await loadCurrentUser(req);
  const userId = getRequestUserId(req);
  if (!user) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }
  if (!userId) {
    return res.status(401).json({ message: 'Sessao invalida.' });
  }

  const nextPlanCode = String(req.body?.planCode || '').trim().toLowerCase();
  if (!isValidPlanCode(nextPlanCode, { onlyActive: true })) {
    return res.status(400).json({ message: 'Plano invalido.' });
  }

  user.planCode = nextPlanCode;
  user.payment_status = 'active';

  const now = new Date();
  user.expirePlan = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  await user.save();

  const usage = await buildUsageSummary(userId);
  const currentPlan = getPlanForUser(user);

  res.json({
    message: `Plano atualizado para ${currentPlan.name}.`,
    user: projectUser(user),
    currentPlan,
    usage,
    plans: listSelectablePlans(),
  });
});
