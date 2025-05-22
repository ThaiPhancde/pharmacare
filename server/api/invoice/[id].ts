import Invoice from "@/server/models/Invoice";

export default defineEventHandler(async (event) => {
  const method = event.method;
  const { id } = event.context.params || {};

  if (!id) {
    return {
      status: false,
      message: "Invoice ID is required",
    };
  }

  if (method === "GET") {
    try {
      const invoice = await Invoice.findById(id)
        .populate("items.medicine")
        .populate("customer");

      if (!invoice) {
        return {
          status: false,
          message: "Invoice not found",
        };
      }

      return {
        status: true,
        data: invoice,
        message: "Invoice details retrieved successfully",
      };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return {
        status: false,
        message: "Failed to fetch invoice details",
      };
    }
  }

  return {
    status: false,
    message: "Method not allowed",
  };
}); 