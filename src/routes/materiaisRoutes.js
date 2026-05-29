import { Router } from 'express';

import {
  createMaterial,
  deleteMaterial,
  listMateriais,
  updateMaterial,
} from '../controllers/materiaisController.js';
import { enforcePlanLimit, requireActivePlanAccess } from '../middleware/planGuard.js';

const router = Router();

router.use(requireActivePlanAccess);
router.get('/', listMateriais);
router.post('/', enforcePlanLimit('materials_total'), createMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export { router as materiaisRoutes };