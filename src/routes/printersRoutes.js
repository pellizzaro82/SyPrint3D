import { Router } from 'express';

import { createPrinter, listPrinters, updatePrinter } from '../controllers/printersController.js';

const router = Router();

router.get('/', listPrinters);
router.post('/', createPrinter);
router.put('/:id', updatePrinter);

export { router as printersRoutes };
