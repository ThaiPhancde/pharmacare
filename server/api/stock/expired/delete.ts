import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  if (event.method !== 'DELETE') {
    return {
      status: false,
      error: 'Method not allowed'
    };
  }

  try {
    const today = new Date();
    
    // Find and delete all expired medicines with any stock
    const result = await Stock.deleteMany({
      expiry_date: { $lt: today },
      $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }]
    });

    return {
      status: true,
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} expired medicine records`
    };
  } catch (error) {
    console.error("Error deleting expired medicines:", error);
    return {
      status: false,
      error: "Unable to delete expired medicines"
    };
  }
}); 