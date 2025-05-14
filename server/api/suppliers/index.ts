import Supplier from "@/server/models/Supplier";
import { supplierFormSchema } from "@/server/models/Supplier";
import { protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = Number(query.limit || 10);
    const page = Number(query.page || 1);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Supplier.find().skip(skip).limit(limit),
      Supplier.countDocuments(),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error",
    };
  }
});

export const createSupplier = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const dataResponse = await Supplier.create(body);
    
    return {
      data: dataResponse, // Sử dụng interface thay vì `Supplier`
    };
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error",
    };
  }
}); 