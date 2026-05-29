import { Router } from 'express';

import { getRelatoriosData, getRelatoriosPdf } from '../controllers/relatoriosController.js';

const router = Router();

router.get('/', getRelatoriosData);
router.get('/pdf', getRelatoriosPdf);

export { router as relatoriosRoutes };
