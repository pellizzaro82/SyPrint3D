import { Router } from 'express';

import { getMyPlan, updateMyPlan } from '../controllers/accountController.js';

const router = Router();

router.get('/plan', getMyPlan);
router.put('/plan', updateMyPlan);

export { router as accountRoutes };
