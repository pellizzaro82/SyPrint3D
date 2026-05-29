import mongoose from 'mongoose';

const ImpressoraSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  numeroSerie: { type: String },
  valorCompra: { type: Number },
  dataCompra: { type: Date },
  consumoW: { type: Number, min: 0, default: 0 },
  custoKwh: { type: Number, min: 0, default: 0.95 },
  custoDepreciacaoHora: { type: Number, min: 0, default: 0 },
  foto: { type: String }, // base64 ou url
  ativo: { type: Boolean, default: true },
}, { timestamps: true, collection: 'Equipamentos' });

export default mongoose.model('Impressora', ImpressoraSchema);
