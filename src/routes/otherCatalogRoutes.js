import { Router } from 'express';

import { getOtherCatalog, updateOtherCatalog } from '../controllers/otherCatalogController.js';

const router = Router();

router.get('/', getOtherCatalog);
router.put('/', updateOtherCatalog);

export { router as otherCatalogRoutes };
