import { Router } from 'express';

import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUser,
} from '../controllers/adminUsersController.js';
import { listAdminPlans as listPlansAdmin, updateAdminPlans as updatePlansAdmin } from '../controllers/adminPlansController.js';
import { requireAdmin } from '../middleware/planGuard.js';

const router = Router();

router.use(requireAdmin);
router.get('/plans', listPlansAdmin);
router.put('/plans', updatePlansAdmin);
router.get('/users', listAdminUsers);
router.post('/users', createAdminUser);
router.put('/users/:id', updateAdminUser);
router.delete('/users/:id', deleteAdminUser);

export { router as adminUsersRoutes };
