import mongoose from 'mongoose';

const filamentSchema = new mongoose.Schema(
  {
    descricao: { type: String, trim: true },
    tipoMaterial: { type: String, enum: ['Filamento', 'Resina'], trim: true },
    unidadeMedida: { type: String, enum: ['g', 'kg', 'ml', 'L'], default: 'g' },
    marca: { type: String, trim: true },
    fornecedor: { type: String, trim: true },
    lote: { type: String, trim: true },
    dataCompra: { type: Date },
    validade: { type: Date },
    tipo: { type: String, required: true, trim: true },
    cor: { type: String, required: true, trim: true },
    material: { type: String, required: true, trim: true },
    peso: { type: Number, required: true, min: 0 },
    precoCusto: { type: Number, min: 0 },
    quantidadeDisponivel: { type: Number, min: 0 },
    precoPorKg: { type: Number, required: true, min: 0 },
    estoqueAtual: { type: Number, required: true, min: 0 },
    estoqueMinimo: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Filament = mongoose.model('Filament', filamentSchema);
