import crypto from 'crypto';
import { Invoice } from '~/server/models';
import { IResponse } from '@/utils/api';

// MoMo configuration (same as in momo.post.ts)
const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO'
};

export default defineEventHandler(async (event) => {
  try {
    // Get orderId from query parameters
    const query = getQuery(event);
    const orderId = query.orderId;
    
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'orderId is required'
      });
    }
    
    // Normalize the orderId by replacing spaces with dashes and converting to uppercase
    const normalizedOrderId = String(orderId).replace(/\s+/g, '-').toUpperCase();
    console.log(`Checking payment status for normalized ID: ${normalizedOrderId} (original: ${orderId})`);
    
    // Check if invoice exists and has been paid
    // Use findOne instead of findById to handle string IDs
    const invoice = await Invoice.findOne({ _id: normalizedOrderId });
    
    console.log(`Status check result: ${invoice ? 'Invoice found' : 'Invoice not found'}`);
    if (invoice) {
      console.log(`Invoice details: Payment status = ${invoice.payment_status}, Method = ${invoice.payment_method}`);
    }
    
    if (!invoice) {
      // Also try to find the invoice with original ID format as fallback
      const fallbackInvoice = await Invoice.findOne({ _id: orderId });
      if (fallbackInvoice) {
        console.log(`Found invoice using original ID format: ${orderId}`);
        return {
          status: true,
          data: { 
            status: fallbackInvoice.payment_status === 'paid' ? 'paid' : 'pending',
            payment_details: fallbackInvoice.payment_details || {},
            invoice_id: fallbackInvoice._id
          },
          message: fallbackInvoice.payment_status === 'paid' ? 
            'Payment has been completed' : 'Payment is still pending'
        } as IResponse<any>;
      }
      
      return {
        status: false,
        data: { status: 'not_found' },
        message: 'Invoice not found'
      } as IResponse<any>;
    }
    
    // If the invoice has payment_status field and it's paid
    if (invoice.payment_status === 'paid') {
      return {
        status: true,
        data: { 
          status: 'paid',
          payment_details: invoice.payment_details || {},
          invoice_id: invoice._id
        },
        message: 'Payment has been completed'
      } as IResponse<any>;
    }
    
    // In a production app, you would make a request to MoMo API to check payment status
    // For this implementation, we'll assume if it's not in the database as paid, it's still pending
    return {
      status: true,
      data: { 
        status: 'pending',
        invoice_id: invoice._id
      },
      message: 'Payment is still pending'
    } as IResponse<any>;
  } catch (error: any) {
    console.error('MoMo status check error:', error);
    return {
      status: false,
      message: error.message || 'Failed to check payment status',
      data: null
    } as IResponse<any>;
  }
}); 