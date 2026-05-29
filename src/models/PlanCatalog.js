import mongoose from 'mongoose';

const planLimitSchema = new mongoose.Schema(
  {
    ordersPerMonth: { type: Number, default: null },
    clientsTotal: { type: Number, default: null },
    productsTotal: { type: Number, default: null },
    materialsTotal: { type: Number, default: null },
  },
  { _id: false }
);

const planPermissionSchema = new mongoose.Schema(
  {
    dashboard: { type: Boolean, default: true },
    pedidos: { type: Boolean, default: true },
    orcamentos: { type: Boolean, default: true },
    clientes: { type: Boolean, default: true },
    produtos: { type: Boolean, default: true },
    materiais: { type: Boolean, default: true },
    compras: { type: Boolean, default: true },
    equipamentos: { type: Boolean, default: true },
    outrosCadastros: { type: Boolean, default: true },
    relatorios: { type: Boolean, default: true },
    configuracoes: { type: Boolean, default: true },
  },
  { _id: false }
);

const planItemSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    monthlyPrice: { type: Number, required: true, default: 0 },
    discountPercent: { type: Number, default: 0 },
    promoLabel: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    limits: { type: planLimitSchema, default: () => ({}) },
    permissions: { type: planPermissionSchema, default: () => ({}) },
    features: { type: [String], default: [] },
  },
  { _id: false }
);

const planCatalogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'master' },
    plans: { type: [planItemSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'PlanCatalog' }
);

export const PlanCatalog = mongoose.model('PlanCatalog', planCatalogSchema);
