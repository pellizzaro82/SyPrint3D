import { Router } from 'express';

import { accountRoutes } from './accountRoutes.js';
import { adminUsersRoutes } from './adminUsersRoutes.js';
import { configuracoesRoutes } from './configuracoesRoutes.js';
import { clientsRoutes } from './clientsRoutes.js';
import { dashboardRoutes } from './dashboardRoutes.js';
import { financeRoutes } from './financeRoutes.js';
import { otherCatalogRoutes } from './otherCatalogRoutes.js';
import { ordersRoutes } from './ordersRoutes.js';
import impressorasRoutes from './impressorasRoutes.js';
import { productsRoutes } from './productsRoutes.js';
import { materiaisRoutes } from './materiaisRoutes.js';
import orcamentosRoutes from './orcamentosRoutes.js';
import comprasRoutes from './comprasRoutes.js';

const router = Router();

router.use('/account', accountRoutes);
router.use('/admin', adminUsersRoutes);
router.use('/configuracoes', configuracoesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/pedidos', ordersRoutes);
router.use('/clientes', clientsRoutes);
router.use('/produtos', productsRoutes);
router.use('/financeiro', financeRoutes);
router.use('/outros-cadastros', otherCatalogRoutes);
router.use('/materiais', materiaisRoutes);

router.use('/orcamentos', orcamentosRoutes);
router.use('/compras', comprasRoutes);
router.use('/equipamentos', impressorasRoutes);
router.use('/impressoras', impressorasRoutes);

export { router as routes };
