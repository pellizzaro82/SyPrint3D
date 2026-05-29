import mongoose from 'mongoose';

export async function connectDatabase() {
  const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/syprint3d';

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB conectado com sucesso.');
  } catch (error) {
    console.error('Erro ao conectar no MongoDB:', error.message);
    process.exit(1);
  }
}
