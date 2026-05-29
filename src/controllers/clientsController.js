import { Client } from '../models/Client.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listClients = asyncHandler(async (req, res) => {
  const clients = await Client.find().sort({ createdAt: -1 });
  res.json(clients);
});

export const createClient = asyncHandler(async (req, res) => {
  const client = await Client.create(req.body);
  res.status(201).json(client);
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!client) {
    return res.status(404).json({ message: 'Cliente nao encontrado.' });
  }

  res.json(client);
});

export const deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndDelete(req.params.id);

  if (!client) {
    return res.status(404).json({ message: 'Cliente nao encontrado.' });
  }

  return res.status(204).send();
});
