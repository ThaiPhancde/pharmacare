import crypto from 'crypto';
import { IResponse } from '@/utils/api';

// MoMo configuration
const momoConfig = {
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/payment/callback',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payment/momo/ipn',
  requestType: 'payWithMethod',
  orderInfo: 'PharmaCare Payment',
  lang: 'vi'
};

interface MoMoPaymentRequest {
  amount: number;
  orderId: string;
  orderInfo?: string;
  extraData?: string;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<MoMoPaymentRequest>(event);
    
    // Validate request
    if (!body.amount || !body.orderId) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Amount and orderId are required' 
      });
    }
    
    // Generate request parameters
    const requestId = `${momoConfig.partnerCode}_${Date.now()}`;
    const orderId = body.orderId;
    const amount = body.amount.toString();
    const orderInfo = body.orderInfo || momoConfig.orderInfo;
    const extraData = body.extraData || '';
    const autoCapture = true;
    
    // Create raw signature
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;
    
    // Generate signature
    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
    
    // Create request body
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      partnerName: 'PharmaCare',
      storeId: 'PharmaCare',
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      lang: momoConfig.lang,
      requestType: momoConfig.requestType,
      autoCapture,
      extraData,
      signature
    };
    
    // Send request to MoMo
    const momoUrl = 'https://test-payment.momo.vn/v2/gateway/api/create';
    
    const response = await $fetch(momoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestBody)).toString()
      },
      body: requestBody
    });
    
    // Check response
    if ((response as any).resultCode === 0) {
      return {
        status: true,
        data: {
          payUrl: (response as any).payUrl,
          deeplink: (response as any).deeplink,
          qrCodeUrl: (response as any).qrCodeUrl,
          requestId,
          orderId
        },
        message: 'MoMo payment URL created successfully'
      } as IResponse<any>;
    } else {
      throw createError({ 
        statusCode: 400, 
        statusMessage: (response as any).message || 'MoMo payment creation failed' 
      });
    }
    
  } catch (error: any) {
    console.error('MoMo payment error:', error);
    throw createError({ 
      statusCode: error.statusCode || 500, 
      statusMessage: error.statusMessage || 'Failed to create MoMo payment' 
    });
  }
}); 