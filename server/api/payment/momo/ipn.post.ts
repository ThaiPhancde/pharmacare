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
      const invoice = await Invoice.findById(body.orderId);
      if (invoice) {
        invoice.payment_status = 'paid';
        invoice.payment_details = {
          ...invoice.payment_details,
          momo_transaction_id: body.transId,
          momo_request_id: body.requestId,
          payment_time: new Date(body.responseTime)
        };
        await invoice.save();
        
        console.log(`MoMo payment successful for invoice ${body.orderId}`);
      }
    } else {
      // Payment failed
      console.log(`MoMo payment failed for order ${body.orderId}: ${body.message}`);
    }
    
    // Always return 204 to MoMo
    return { statusCode: 204 };
    
  } catch (error) {
    console.error('MoMo IPN error:', error);
    return { statusCode: 500, message: 'Internal server error' };
  }
}); 