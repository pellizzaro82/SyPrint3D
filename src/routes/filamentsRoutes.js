import { Router } from 'express';

import {
  createFilament,
  deleteFilament,
  listFilaments,
  updateFilament,
} from '../controllers/filamentsController.js';

const router = Router();

router.get('/', listFilaments);
router.post('/', createFilament);
router.put('/:id', updateFilament);
router.delete('/:id', deleteFilament);

export { router as filamentsRoutes };
