import mongoose from "mongoose";

export default defineNitroPlugin(() => {
  mongoose.connect(process.env.MONGO_URI as string, {});
});
