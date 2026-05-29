import { Router } from 'express';

import { createClient, deleteClient, listClients, updateClient } from '../controllers/clientsController.js';

const router = Router();

router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

export { router as clientsRoutes };
