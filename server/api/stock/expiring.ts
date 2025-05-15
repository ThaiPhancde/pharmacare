import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const days = parseInt(query.days as string) || 30; // Default to 30 days
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const today = new Date();
  const expiryDate = new Date();
  expiryDate.setDate(today.getDate() + days);

  try {
    const [data, total] = await Promise.all([
      Stock.find({
        expiry_date: { $gte: today, $lte: expiryDate },
        $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }],
      })
        .populate("medicine")
        .populate({
          path: "purchase",
          select: "invoice_no date supplier",
          populate: {
            path: "supplier",
            select: "name phone"
          }
        })
        .skip(skip)
        .limit(limit)
        .sort({ expiry_date: 1 }),
      Stock.countDocuments({
        expiry_date: { $gte: today, $lte: expiryDate },
        $or: [{ box_quantity: { $gt: 0 } }, { unit_quantity: { $gt: 0 } }],
      }),
    ]);

    // Add information about days left until expiry
    const enhancedData = data.map(item => {
      const expiryTime = new Date(item.expiry_date).getTime();
      const todayTime = today.getTime();
      const diffTime = expiryTime - todayTime;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...item.toObject(),
        daysLeft
      };
    });

    return {
      status: true,
      data: enhancedData,
      total,
      message: "Data retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching expiring stocks:", error);
    return {
      status: false,
      error: "Unable to fetch expiring medicines data",
    };
  }
});
