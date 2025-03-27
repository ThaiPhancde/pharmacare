import mongoose from "mongoose";

export default defineNitroPlugin((nitroApp) => {
  const config = useRuntimeConfig()
  const mongoUri = config.mongoUri || process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('MongoDB URI is not defined in environment variables or runtime config');
    return;
  }
  
  mongoose.connect(mongoUri as string, {})
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB', err);
    });
});
