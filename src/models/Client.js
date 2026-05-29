import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    cpfCnpj: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    cep: { type: String, trim: true },
    logradouro: { type: String, trim: true },
    numero: { type: String, trim: true },
    complemento: { type: String, trim: true },
    bairro: { type: String, trim: true },
    cidade: { type: String, trim: true },
    estado: { type: String, trim: true },
    endereco: { type: String, trim: true },
    observacoes: { type: String, trim: true },
    dataCadastro: { type: Date, default: Date.now },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'Clientes' }
);

export const Client = mongoose.model('Client', clientSchema);
