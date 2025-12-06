// PayPal order capture after user approval

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { order_id } = body

    if (!order_id) {
      return {
        status: false,
        message: 'Order ID is required',
      }
    }

    const config = useRuntimeConfig()
    
    const PAYPAL_API = config.public.paypalMode === 'live' 
      ? 'https://api-m.paypal.com' 
      : 'https://api-m.sandbox.paypal.com'

    const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')

    // Capture the payment
    const response = await $fetch(`${PAYPAL_API}/v2/checkout/orders/${order_id}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
    })

    const captureData = response as any

    if (captureData.status === 'COMPLETED') {
      return {
        status: true,
        data: {
          order_id: captureData.id,
          payer_id: captureData.payer?.payer_id,
          payer_email: captureData.payer?.email_address,
          amount: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value,
          currency: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.currency_code,
          capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        },
        message: 'Payment captured successfully',
      }
    }

    return {
      status: false,
      message: 'Payment capture failed',
      data: captureData,
    }
  }
  catch (error: any) {
    console.error('PayPal Capture Order Error:', error)
    return {
      status: false,
      message: error.message || 'Failed to capture payment',
    }
  }
})
