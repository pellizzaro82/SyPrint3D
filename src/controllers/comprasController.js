import Compra from '../models/Compra.js';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

export const getCompras = async (req, res) => {
  const compras = await Compra.find(withOwnerScope(req));
  res.json(compras);
};

export const createCompra = async (req, res) => {
  const data = req.body;
  const compra = new Compra(withOwnerPayload(req, data));
  await compra.save();
  res.status(201).json(compra);
};

export const updateCompra = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const compra = await Compra.findOneAndUpdate(withOwnerScope(req, { _id: id }), data, { new: true });
  res.json(compra);
};

export const deleteCompra = async (req, res) => {
  const { id } = req.params;
  await Compra.findOneAndDelete(withOwnerScope(req, { _id: id }));
  res.status(204).end();
};
