import crypto from 'crypto';
import { Invoice } from '~/server/models';

// MoMo configuration (same as in momo.post.ts)
const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO'
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Verify signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${body.amount}&extraData=${body.extraData}&message=${body.message}&orderId=${body.orderId}&orderInfo=${body.orderInfo}&orderType=${body.orderType}&partnerCode=${body.partnerCode}&payType=${body.payType}&requestId=${body.requestId}&responseTime=${body.responseTime}&resultCode=${body.resultCode}&transId=${body.transId}`;
    
    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    if (signature !== body.signature) {
      console.error('Invalid MoMo IPN signature');
      return { statusCode: 400, message: 'Invalid signature' };
    }
    
    // Process payment result
    if (body.resultCode === 0) {
      // Payment successful
      // Normalize the orderId by replacing spaces with dashes and converting to uppercase
      const normalizedOrderId = body.orderId.replace(/\s+/g, '-').toUpperCase();
      console.log(`[IPN] Processing successful payment for order ${normalizedOrderId}`);
      
      // Use findOne with _id field instead of findById to handle string IDs properly
      const invoice = await Invoice.findOne({ _id: normalizedOrderId });
      if (invoice) {
        console.log(`[IPN] Found invoice ${normalizedOrderId}, updating payment status`);
        
        // Update invoice payment status
        invoice.payment_status = 'paid';
        invoice.paid = invoice.grand_total;
        invoice.due = 0;
        invoice.payment_details = {
          ...invoice.payment_details || {},
          momo_transaction_id: body.transId,
          momo_request_id: body.requestId,
          payment_time: new Date(body.responseTime)
        };
        await invoice.save();
        
        console.log(`[IPN] MoMo payment successful for invoice ${normalizedOrderId}`);
      } else {
        console.log(`[IPN] Invoice ${normalizedOrderId} not found, creating placeholder`);
        
        // If invoice doesn't exist yet (which shouldn't happen with new flow), create a placeholder
        await Invoice.create({
          _id: normalizedOrderId,
          date: new Date(),
          items: [],
          subtotal: 0,
          grand_total: parseInt(body.amount),
          paid: parseInt(body.amount),
          due: 0,
          payment_method: 'momo',
          payment_status: 'paid',
          payment_details: {
            momo_transaction_id: body.transId,
            momo_request_id: body.requestId,
            payment_time: new Date(body.responseTime),
            is_placeholder: true // Mark this as a placeholder to be filled later
          },
          is_pos: true
        });
        
        console.log(`[IPN] Created placeholder invoice for ${normalizedOrderId}`);
      }
    } else {
      // Payment failed
      const normalizedOrderId = body.orderId.replace(/\s+/g, '-').toUpperCase();
      console.log(`[IPN] MoMo payment failed for order ${normalizedOrderId}: ${body.message}`);
      
      // Update invoice to mark payment as failed
      const invoice = await Invoice.findOne({ _id: normalizedOrderId });
      if (invoice) {
        invoice.payment_status = 'failed';
        invoice.payment_details = {
          ...invoice.payment_details || {},
          error_message: body.message,
          error_code: body.resultCode
        };
        await invoice.save();
        
        console.log(`[IPN] Updated invoice ${normalizedOrderId} to failed status`);
      }
    }
    
    // Always return 204 to MoMo
    return { statusCode: 204 };
    
  } catch (error) {
    console.error('MoMo IPN error:', error);
    return { statusCode: 500, message: 'Internal server error' };
  }
}); 