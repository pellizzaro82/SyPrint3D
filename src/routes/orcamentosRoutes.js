import express from 'express';
import {
  getOrcamentos,
  createOrcamento,
  updateOrcamento,
  deleteOrcamento,
} from '../controllers/orcamentosController.js';

const router = express.Router();

router.get('/', getOrcamentos);
router.post('/', createOrcamento);
router.put('/:id', updateOrcamento);
router.delete('/:id', deleteOrcamento);

export default router;
