import "@/server/models";
import Medicine from "@/server/models/Medicine";
import Stock from "@/server/models/Stock";

export default defineEventHandler(async (event) => {
  const method = event.method;
  if (method === "GET") {
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Medicine.find()
        .skip(skip)
        .limit(limit)
        .populate("unit_id category_id type_id"),
      Medicine.countDocuments(),
    ]);

    return {
      data,
      total,
      status: true,
      message: "Get data successfully",
    };
  }

  if (method === "POST") {
    const body = await readBody(event);
    const session = await Medicine.startSession();
    session.startTransaction();

    try {
      // 1. Tạo medicine
      const createdMedicine = await Medicine.create([body], { session });

      // 2. Tạo stock liên kết
      await Stock.create(
        [
          {
            medicine: createdMedicine[0]._id,
            batch_id: createdMedicine[0].bar_code,
            box_pattern: "",
            box_quantity: 0,
            unit_quantity: 0,
          },
        ],
        { session }
      );

      // 3. Commit transaction
      await session.commitTransaction();
      session.endSession();

      return { status: true, data: createdMedicine[0] };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction failed:", err);
      return { status: false, error: "Transaction failed" };
    }
  }
});
