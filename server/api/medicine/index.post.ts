import Medicine from '@/server/models/Medicine';

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string; description?: string; price: number; stock: number }>(event);
  return await Medicine.create(body);
});