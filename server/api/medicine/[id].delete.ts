import Medicine from '@/server/models/Medicine';

export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event) as { id: string };
  return await Medicine.findByIdAndDelete(id);
});