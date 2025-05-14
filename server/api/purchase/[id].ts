import Purchase from "@/server/models/Purchase";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  if (method === "GET") {
    try {
      const purchase = await Purchase.findById(id)
        .populate('supplier')
        .populate('items.medicine');
      
      if (!purchase) {
        return { 
          status: false, 
          message: "Purchase not found" 
        };
      }
      
      return { 
        status: true, 
        data: purchase,
        message: "Purchase details retrieved successfully" 
      };
    } catch (error) {
      console.error("Error fetching purchase details:", error);
      return { 
        status: false, 
        message: "Failed to fetch purchase details" 
      };
    }
  }

  if (method === "PUT") {
    const body = await readBody(event);
    const updated = await Purchase.findByIdAndUpdate(id, body, { new: true });
    return { status: true, data: updated };
  }

  if (method === "DELETE") {
    await Purchase.findByIdAndDelete(id);
    return { status: true, message: "Deleted" };
  }
});