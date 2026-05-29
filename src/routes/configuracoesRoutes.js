import { Router } from 'express';

import { getConfiguracoes, updateConfiguracoes } from '../controllers/configuracoesController.js';

const router = Router();

router.get('/', getConfiguracoes);
router.put('/', updateConfiguracoes);

export { router as configuracoesRoutes };
