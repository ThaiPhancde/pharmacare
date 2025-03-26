import Medicine from '@/server/models/Medicine';

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event) as { id: string };
  const body = await readBody<{ name?: string; description?: string; price?: number; stock?: number }>(event);
  return await Medicine.findByIdAndUpdate(id, body, { new: true });
});