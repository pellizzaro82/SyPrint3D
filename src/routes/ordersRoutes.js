import { Router } from 'express';

import { createOrder, listOrders, updateOrder, deleteOrder } from '../controllers/ordersController.js';
import { enforcePlanLimit, requireActivePlanAccess } from '../middleware/planGuard.js';

const router = Router();

router.use(requireActivePlanAccess);
router.get('/', listOrders);
router.post('/', enforcePlanLimit('orders_month'), createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export { router as ordersRoutes };
