import Medicine from '@/server/models/Medicine';

export default defineEventHandler(async () => {
  return await Medicine.find();
});
