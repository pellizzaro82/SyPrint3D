import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { Client } from '../models/Client.js';
import { Product } from '../models/Product.js';
import { Material } from '../models/Material.js';
import { Order } from '../models/Order.js';
import Orcamento from '../models/Orcamento.js';
import { FinanceEntry } from '../models/FinanceEntry.js';
import Impressora from '../models/Impressora.js';
import Compra from '../models/Compra.js';
import { AppConfig } from '../models/AppConfig.js';
import { OtherCatalog } from '../models/OtherCatalog.js';

dotenv.config();

const MONGO_URI = String(process.env.MONGO_URI || '').trim();
const TARGET_USER_ID = String(process.env.BACKFILL_OWNER_USER_ID || '').trim();

if (!MONGO_URI) {
  console.error('MONGO_URI nao definido.');
  process.exit(1);
}

if (!mongoose.Types.ObjectId.isValid(TARGET_USER_ID)) {
  console.error('BACKFILL_OWNER_USER_ID invalido ou ausente.');
  process.exit(1);
}

const ownerUserId = new mongoose.Types.ObjectId(TARGET_USER_ID);

async function backfillModel(model, label) {
  const result = await model.updateMany(
    { $or: [{ ownerUserId: { $exists: false } }, { ownerUserId: null }] },
    { $set: { ownerUserId } }
  );

  console.log(`${label}: matched=${result.matchedCount} modified=${result.modifiedCount}`);
}

async function run() {
  await mongoose.connect(MONGO_URI);

  await backfillModel(Client, 'Clientes');
  await backfillModel(Product, 'Produtos');
  await backfillModel(Material, 'Materiais');
  await backfillModel(Order, 'Pedidos');
  await backfillModel(Orcamento, 'Orcamentos');
  await backfillModel(FinanceEntry, 'Financeiro/Compras');
  await backfillModel(Impressora, 'Equipamentos');
  await backfillModel(Compra, 'Compras legado');
  await backfillModel(AppConfig, 'ConfiguracoesApp');
  await backfillModel(OtherCatalog, 'OutrosCadastros');

  await mongoose.disconnect();
}

run()
  .then(() => {
    console.log('Backfill concluido.');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
