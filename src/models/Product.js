import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    categoria: { type: String, trim: true },
    stl: { type: String, trim: true },
    fotos: [{ type: String, trim: true }],
    pesoMedio: { type: Number, default: 0 },
    tempoMedio: { type: Number, default: 0 },
    custo: { type: Number, default: 0 },
    margem: { type: Number, default: 0 },
    precoFinal: { type: Number, default: 0 },
    descricao: { type: String, trim: true },
    unidade: { type: String, default: 'unidade' },
    estoqueInicial: { type: Number, default: 0 },
    estoqueMinimo: { type: Number, default: 5 },
  },
  { timestamps: true, collection: 'Produtos' }
);

export const Product = mongoose.model('Product', productSchema);
