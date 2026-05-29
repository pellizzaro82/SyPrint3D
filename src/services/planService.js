import { PlanCatalog } from '../models/PlanCatalog.js';

export const PLAN_LIMIT_DEFINITIONS = [
  { key: 'ordersPerMonth', label: 'Pedidos por mes' },
  { key: 'clientsTotal', label: 'Total de clientes' },
  { key: 'productsTotal', label: 'Total de produtos' },
  { key: 'materialsTotal', label: 'Total de materiais' },
];

export const PLAN_PERMISSION_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pedidos', label: 'Pedidos' },
  { key: 'orcamentos', label: 'Orcamentos' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'produtos', label: 'Produtos' },
  { key: 'materiais', label: 'Materiais' },
  { key: 'compras', label: 'Compras' },
  { key: 'equipamentos', label: 'Equipamentos' },
  { key: 'outrosCadastros', label: 'Outros cadastros' },
  { key: 'relatorios', label: 'Relatorios' },
  { key: 'configuracoes', label: 'Configuracoes' },
];

const DEFAULT_PERMISSIONS = PLAN_PERMISSION_DEFINITIONS.reduce((acc, item) => {
  acc[item.key] = true;
  return acc;
}, {});

const DEFAULT_PLAN_CATALOG = {
  basic: {
    code: 'basic',
    name: 'Basic',
    monthlyPrice: 79,
    discountPercent: 0,
    promoLabel: '',
    isActive: true,
    limits: {
      ordersPerMonth: 10,
      clientsTotal: 10,
      productsTotal: 10,
      materialsTotal: 10,
    },
    permissions: {
      ...DEFAULT_PERMISSIONS,
      relatorios: false,
      configuracoes: false,
    },
    features: ['Cadastro e operacao ERP essenciais', 'Suporte padrao'],
  },
  premium: {
    code: 'premium',
    name: 'Premium',
    monthlyPrice: 199,
    discountPercent: 0,
    promoLabel: '',
    isActive: true,
    limits: {
      ordersPerMonth: null,
      clientsTotal: null,
      productsTotal: null,
      materialsTotal: null,
    },
    permissions: {
      ...DEFAULT_PERMISSIONS,
    },
    features: ['Operacao sem limites', 'Relatorios e configuracoes completos', 'Suporte prioritario'],
  },
};

let runtimePlanCatalog = JSON.parse(JSON.stringify(DEFAULT_PLAN_CATALOG));

function toPlanCode(value, fallback = '') {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .slice(0, 40);
}

function toMoney(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Number(parsed.toFixed(2)));
}

function toDiscount(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, Number(parsed.toFixed(2))));
}

function normalizeLimit(value) {
  if (value === null || typeof value === 'undefined' || String(value).trim() === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
}

function normalizeFeatures(features) {
  const list = Array.isArray(features) ? features : [];
  const clean = list
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 16);
  return [...new Set(clean)];
}

function normalizePermissions(input, fallback = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return PLAN_PERMISSION_DEFINITIONS.reduce((acc, item) => {
    if (typeof source[item.key] === 'boolean') {
      acc[item.key] = source[item.key];
      return acc;
    }
    if (typeof fallback[item.key] === 'boolean') {
      acc[item.key] = fallback[item.key];
      return acc;
    }
    acc[item.key] = DEFAULT_PERMISSIONS[item.key];
    return acc;
  }, {});
}

function normalizeLimits(input, fallback = {}) {
  const source = input && typeof input === 'object' ? input : {};
  return PLAN_LIMIT_DEFINITIONS.reduce((acc, item) => {
    const raw = source[item.key];
    const next = normalizeLimit(raw);
    acc[item.key] = next === null ? normalizeLimit(fallback[item.key]) : next;
    return acc;
  }, {});
}

function normalizePlan(input, index = 0) {
  const baseCode = index === 0 ? 'basic' : `plano-${index + 1}`;
  const code = toPlanCode(input?.code, baseCode) || baseCode;
  const fallback = runtimePlanCatalog[code] || {};
  const monthlyPrice = toMoney(input?.monthlyPrice, toMoney(fallback.monthlyPrice, 0));
  const discountPercent = toDiscount(input?.discountPercent, toDiscount(fallback.discountPercent, 0));
  const isActive = typeof input?.isActive === 'boolean' ? input.isActive : fallback.isActive !== false;

  return {
    code,
    name: String(input?.name || fallback.name || code).trim().slice(0, 80),
    monthlyPrice,
    discountPercent,
    promoLabel: String(input?.promoLabel || fallback.promoLabel || '').trim().slice(0, 120),
    isActive,
    limits: normalizeLimits(input?.limits, fallback.limits || {}),
    permissions: normalizePermissions(input?.permissions, fallback.permissions || {}),
    features: normalizeFeatures(input?.features),
  };
}

function buildCatalogFromList(plansInput) {
  const source = Array.isArray(plansInput) ? plansInput : [];
  const catalog = {};
  const usedCodes = new Set();

  source.forEach((planInput, index) => {
    const normalized = normalizePlan(planInput, index);
    if (usedCodes.has(normalized.code)) {
      throw new Error(`PLAN_DUPLICATED_CODE:${normalized.code}`);
    }
    usedCodes.add(normalized.code);
    catalog[normalized.code] = normalized;
  });

  if (!Object.keys(catalog).length) {
    return JSON.parse(JSON.stringify(DEFAULT_PLAN_CATALOG));
  }

  const hasActivePlan = Object.values(catalog).some((plan) => plan.isActive !== false);
  if (!hasActivePlan) {
    const firstKey = Object.keys(catalog)[0];
    catalog[firstKey].isActive = true;
  }

  return catalog;
}

function withPromotionalPrice(plan) {
  const discountPercent = toDiscount(plan?.discountPercent || 0, 0);
  const basePrice = toMoney(plan?.monthlyPrice || 0, 0);
  const promotionalPrice = Math.max(0, Number((basePrice * (1 - discountPercent / 100)).toFixed(2)));
  return {
    ...plan,
    discountPercent,
    promotionalPrice,
  };
}

export function listPlans(options = {}) {
  const onlyActive = Boolean(options?.onlyActive);
  const plans = Object.values(runtimePlanCatalog)
    .filter((plan) => (onlyActive ? plan.isActive !== false : true))
    .map((plan) => withPromotionalPrice(plan));

  return plans.sort((a, b) => Number(a.monthlyPrice || 0) - Number(b.monthlyPrice || 0));
}

export function listSelectablePlans() {
  return listPlans({ onlyActive: true });
}

export function isValidPlanCode(code, options = {}) {
  const normalized = toPlanCode(code);
  const plan = runtimePlanCatalog[normalized];
  if (!plan) return false;
  if (Boolean(options?.onlyActive) && plan.isActive === false) return false;
  return true;
}

function getFallbackPlan() {
  if (runtimePlanCatalog.premium) return runtimePlanCatalog.premium;
  if (runtimePlanCatalog.basic) return runtimePlanCatalog.basic;
  const first = Object.values(runtimePlanCatalog)[0];
  return first || withPromotionalPrice(DEFAULT_PLAN_CATALOG.premium);
}

export function getPlanCodeForUser(user) {
  if (user?.isAdmin) {
    if (runtimePlanCatalog.premium) return 'premium';
    return getFallbackPlan().code;
  }

  const code = toPlanCode(user?.planCode);
  if (isValidPlanCode(code)) return code;

  const activePlan = listSelectablePlans()[0];
  if (activePlan?.code) return activePlan.code;
  return getFallbackPlan().code;
}

export function getPlanForUser(user) {
  const code = getPlanCodeForUser(user);
  return withPromotionalPrice(runtimePlanCatalog[code] || getFallbackPlan());
}

export function hasPlanPermission(user, permissionKey) {
  if (user?.isAdmin) return true;
  const key = String(permissionKey || '').trim();
  if (!key) return true;

  const plan = getPlanForUser(user);
  const value = plan?.permissions?.[key];
  if (typeof value !== 'boolean') return true;
  return value;
}

export async function hydratePlanCatalogFromDatabase() {
  const doc = await PlanCatalog.findOne({ key: 'master' }).lean();
  if (!doc || !Array.isArray(doc.plans) || !doc.plans.length) {
    runtimePlanCatalog = JSON.parse(JSON.stringify(DEFAULT_PLAN_CATALOG));
    return listPlans();
  }

  runtimePlanCatalog = buildCatalogFromList(doc.plans);
  return listPlans();
}

export async function savePlanCatalog(plansInput, updatedBy = null) {
  const nextCatalog = buildCatalogFromList(plansInput);
  const nextList = Object.values(nextCatalog);

  await PlanCatalog.findOneAndUpdate(
    { key: 'master' },
    {
      key: 'master',
      plans: nextList,
      updatedBy: updatedBy || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  runtimePlanCatalog = nextCatalog;
  return listPlans();
}

export function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

export function hasActiveAccess(user) {
  if (!user) return false;
  if (user.isAdmin) return true;
  const paymentStatus = String(user.payment_status || '').trim().toLowerCase();
  if (paymentStatus !== 'active') return false;

  if (!user.expirePlan) return true;
  const expire = new Date(user.expirePlan);
  if (Number.isNaN(expire.getTime())) return false;

  return expire.getTime() >= Date.now();
}
