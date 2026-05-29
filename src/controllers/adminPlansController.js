import {
  PLAN_LIMIT_DEFINITIONS,
  PLAN_PERMISSION_DEFINITIONS,
  listPlans,
  listSelectablePlans,
  savePlanCatalog,
} from '../services/planService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAdminPlans = asyncHandler(async (req, res) => {
  res.json({
    plans: listPlans(),
    selectablePlans: listSelectablePlans(),
    limits: PLAN_LIMIT_DEFINITIONS,
    permissions: PLAN_PERMISSION_DEFINITIONS,
  });
});

export const updateAdminPlans = asyncHandler(async (req, res) => {
  const plans = Array.isArray(req.body?.plans) ? req.body.plans : [];
  if (!plans.length) {
    return res.status(400).json({ message: 'Informe ao menos um plano para salvar.' });
  }

  let updated;
  try {
    updated = await savePlanCatalog(plans, req.auth?.sub);
  } catch (error) {
    const rawMessage = String(error?.message || '');
    if (rawMessage.startsWith('PLAN_DUPLICATED_CODE:')) {
      const code = rawMessage.split(':')[1] || '-';
      return res.status(400).json({ message: `Codigo de plano duplicado: ${code}. Use codigos unicos.` });
    }
    throw error;
  }

  res.json({
    message: 'Catalogo de planos atualizado com sucesso.',
    plans: updated,
    selectablePlans: listSelectablePlans(),
    limits: PLAN_LIMIT_DEFINITIONS,
    permissions: PLAN_PERMISSION_DEFINITIONS,
  });
});
