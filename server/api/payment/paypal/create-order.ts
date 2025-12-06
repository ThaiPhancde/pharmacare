// PayPal payment integration
// Note: Install @paypal/checkout-server-sdk package first: npm install @paypal/checkout-server-sdk

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, currency = 'USD', description } = body

    if (!amount) {
      return {
        status: false,
        message: 'Amount is required',
      }
    }

    // PayPal SDK setup
    const config = useRuntimeConfig()
    
    // For development, you can use sandbox credentials
    // Add to .env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
    const PAYPAL_API = config.public.paypalMode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')

    // Create PayPal order
    const response = await $fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
            description: description || 'PharmaCare Invoice Payment',
          },
        ],
        application_context: {
          return_url: `${config.public.appUrl}/invoice?payment=success`,
          cancel_url: `${config.public.appUrl}/invoice?payment=cancelled`,
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      },
    })

    return {
      status: true,
      data: {
        order_id: (response as any).id,
        approval_url: (response as any).links?.find((link: any) => link.rel === 'approve')?.href,
      },
      message: 'PayPal order created successfully',
    }
  }
  catch (error: any) {
    console.error('PayPal Create Order Error:', error)
    return {
      status: false,
      message: error.message || 'Failed to create PayPal order',
    }
  }
})
