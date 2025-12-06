import Invoice from "@/server/models/Invoice";

export default defineEventHandler(async (event) => {
  try {
    const { id: rawId } = event.context.params || {};
    const body = await readBody(event);

    if (!rawId) {
      return {
        status: false,
        message: "Invoice ID is required",
      };
    }

    // Normalize the ID - replace spaces with dashes and convert to uppercase
    const id = decodeURIComponent(rawId).replace(/\s+/g, '-').toUpperCase();
    console.log(`Updating payment status for invoice ID: ${id} (original: ${rawId})`);
    console.log(`Update data:`, body);

    // Validate required fields
    if (!body.payment_status) {
      return {
        status: false,
        message: "Payment status is required",
      };
    }

    // Find and update the invoice
    const invoice = await Invoice.findOne({ _id: id });
    
    if (!invoice) {
      console.log(`Invoice not found with ID: ${id}`);
      return {
        status: false,
        message: "Invoice not found",
      };
    }

    // Update payment fields
    if (body.payment_status) {
      invoice.payment_status = body.payment_status;
    }
    
    if (body.paid !== undefined) {
      invoice.paid = body.paid;
    }
    
    if (body.due !== undefined) {
      invoice.due = body.due;
    }

    if (body.payment_details) {
      invoice.payment_details = {
        ...invoice.payment_details || {},
        ...body.payment_details
      };
    }

    // Save the updated invoice
    await invoice.save();
    
    console.log(`Invoice ${id} payment status updated to ${body.payment_status}`);

    return {
      status: true,
      message: "Invoice payment status updated successfully",
      data: {
        _id: invoice._id,
        payment_status: invoice.payment_status,
        paid: invoice.paid,
        due: invoice.due
      }
    };
  } catch (error) {
    console.error("Error updating invoice payment status:", error);
    return {
      status: false,
      message: "Failed to update invoice payment status",
    };
  }
}); 