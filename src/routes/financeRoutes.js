import { Router } from 'express';

import { createFinanceEntry, deleteFinanceEntry, listFinanceEntries, updateFinanceEntry } from '../controllers/financeController.js';

const router = Router();

router.get('/', listFinanceEntries);
router.post('/', createFinanceEntry);
router.put('/:id', updateFinanceEntry);
router.delete('/:id', deleteFinanceEntry);

export { router as financeRoutes };
