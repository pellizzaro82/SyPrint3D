import { Router } from 'express';

import { createProduct, listProducts, updateProduct, deleteProduct } from '../controllers/productsController.js';
import { enforcePlanLimit, requireActivePlanAccess } from '../middleware/planGuard.js';

const router = Router();

router.use(requireActivePlanAccess);
router.get('/', listProducts);
router.post('/', enforcePlanLimit('products_total'), createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export { router as productsRoutes };
