import Impressora from '../models/Impressora.js';
import mongoose from 'mongoose';
import { withOwnerPayload, withOwnerScope } from '../utils/requestUser.js';

export const getImpressoras = async (req, res) => {
  const impressoras = await Impressora.find(withOwnerScope(req));
  res.json(impressoras);
};

export const createImpressora = async (req, res) => {
  const data = {
    ...req.body,
    consumoW: Number(req.body.consumoW || 0),
    custoKwh: Number(req.body.custoKwh || 0.95),
    custoDepreciacaoHora: Number(req.body.custoDepreciacaoHora || 0),
  };
  const impressora = new Impressora(withOwnerPayload(req, data));
  await impressora.save();
  res.status(201).json(impressora);
};

export const updateImpressora = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de equipamento invalido.' });
  }
  const data = {
    ...req.body,
    consumoW: Number(req.body.consumoW || 0),
    custoKwh: Number(req.body.custoKwh || 0.95),
    custoDepreciacaoHora: Number(req.body.custoDepreciacaoHora || 0),
  };
  const impressora = await Impressora.findOneAndUpdate(withOwnerScope(req, { _id: id }), data, { new: true });
  if (!impressora) {
    return res.status(404).json({ message: 'Equipamento nao encontrado.' });
  }
  res.json(impressora);
};

export const deleteImpressora = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de equipamento invalido.' });
  }
  await Impressora.findOneAndDelete(withOwnerScope(req, { _id: id }));
  res.status(204).end();
};
