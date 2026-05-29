import express from 'express';
import {
  getCompras,
  createCompra,
  updateCompra,
  deleteCompra,
} from '../controllers/comprasController.js';

const router = express.Router();

router.get('/', getCompras);
router.post('/', createCompra);
router.put('/:id', updateCompra);
router.delete('/:id', deleteCompra);

export default router;
