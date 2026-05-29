import express from 'express';
import {
  getImpressoras,
  createImpressora,
  updateImpressora,
  deleteImpressora,
} from '../controllers/impressorasController.js';

const router = express.Router();

router.get('/', getImpressoras);
router.post('/', createImpressora);
router.put('/:id', updateImpressora);
router.delete('/:id', deleteImpressora);

export default router;
