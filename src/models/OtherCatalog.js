import mongoose from 'mongoose';

const namedItemSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const fornecedorSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    telefone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    site: { type: String, trim: true, default: '' },
    whatsappVendas: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const otherCatalogSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    chave: { type: String, required: true, default: 'default', trim: true },
    fornecedores: { type: [fornecedorSchema], default: [] },
    categorias: { type: [namedItemSchema], default: [] },
    tiposMaterial: { type: [namedItemSchema], default: [] },
    marcasEquipamentos: { type: [namedItemSchema], default: [] },
    metodosPagamento: { type: [namedItemSchema], default: [] },
  },
  { timestamps: true, collection: 'OutrosCadastros' }
);

otherCatalogSchema.index({ ownerUserId: 1, chave: 1 }, { unique: true });

export const OtherCatalog = mongoose.model('OtherCatalog', otherCatalogSchema);
