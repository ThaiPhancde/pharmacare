import { CampaignModel } from '~/server/models/Campaign'
import { VoucherModel } from '~/server/models/Voucher'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method

    // GET - List all campaigns
    if (method === 'GET') {
      const query = getQuery(event)
      const { status, campaign_type } = query

      const filter: any = {}
      if (status)
        filter.status = status
      if (campaign_type)
        filter.campaign_type = campaign_type

      const campaigns = await CampaignModel.find(filter).sort({ createdAt: -1 })

      // Update campaign stats
      for (const campaign of campaigns) {
        const vouchers = await VoucherModel.find({ campaign: campaign._id })
        campaign.total_vouchers = vouchers.length
        campaign.used_vouchers = vouchers.reduce((sum, v) => sum + (v.usage_count || 0), 0)
        await campaign.save()
      }

      return {
        status: true,
        data: campaigns,
        total: campaigns.length,
        message: 'Lấy danh sách chiến dịch thành công',
      }
    }

    // POST - Create new campaign
    if (method === 'POST') {
      const body = await readBody(event)

      const newCampaign = new CampaignModel({
        ...body,
        total_vouchers: 0,
        used_vouchers: 0,
        total_revenue: 0,
        total_discount: 0,
      })

      await newCampaign.save()

      return {
        status: true,
        data: newCampaign,
        message: 'Tạo chiến dịch thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Campaign API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
