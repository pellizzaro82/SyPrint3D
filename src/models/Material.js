import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    descricao: { type: String, trim: true },
    tipoMaterial: { type: String, enum: ['Filamento', 'Resina'], trim: true },
    unidadeMedida: { type: String, enum: ['g', 'kg', 'ml', 'L'], default: 'g' },
    marca: { type: String, trim: true },
    fornecedor: { type: String, trim: true },
    lote: { type: String, trim: true },
    dataCompra: { type: Date },
    validade: { type: Date },
    tipo: { type: String, required: true, trim: true },
    cor: { type: String, trim: true, default: '' },
    material: { type: String, required: true, trim: true },
    peso: { type: Number, required: true, min: 0 },
    precoCusto: { type: Number, min: 0 },
    quantidadeDisponivel: { type: Number, min: 0 },
    precoPorKg: { type: Number, required: true, min: 0 },
    estoqueAtual: { type: Number, required: true, min: 0 },
    estoqueMinimo: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: 'Materiais' }
);

export const Material = mongoose.model('Material', materialSchema);