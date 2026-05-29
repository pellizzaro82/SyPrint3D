import { Counter } from '../models/Counter.js';

export async function getNextSequenceValue(key) {
  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { value: 1 } },
    { returnDocument: 'after', upsert: true }
  );

  return counter.value;
}

export function formatOrderCode(sequence) {
  return `Nº ${String(sequence).padStart(5, '0')}`;
}
