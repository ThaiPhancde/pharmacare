import Supplier from "@/server/models/Supplier";
import { supplierFormSchema } from "@/server/models/Supplier";
import { protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const response = {
      data:
        (await Supplier.findById(id)) ||
        null,
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error",
    };
  }
});

export const updateSupplier = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const body = await readBody(event);
    const response = {
      data:
        (await Supplier.findByIdAndUpdate(id, body, { new: true })) ||
        null,
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error",
    };
  }
});

export const deleteSupplier = defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id;
    const response = {
      data:
        (await Supplier.findByIdAndDelete(id)) ||
        null,
    };
    return response;
  } catch (error) {
    console.error(error);
    return {
      error: "Internal Server Error",
    };
  }
}); 