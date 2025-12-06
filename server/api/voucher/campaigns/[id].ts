import { CampaignModel } from '~/server/models/Campaign'
import { VoucherModel } from '~/server/models/Voucher'

export default defineEventHandler(async (event) => {
  try {
    const method = event.method
    const id = event.context.params?.id

    if (!id) {
      return {
        status: false,
        message: 'ID chiến dịch không hợp lệ',
      }
    }

    // GET - Get campaign detail with vouchers
    if (method === 'GET') {
      const campaign = await CampaignModel.findById(id)
      if (!campaign) {
        return {
          status: false,
          message: 'Không tìm thấy chiến dịch',
        }
      }

      const vouchers = await VoucherModel.find({ campaign: id })

      return {
        status: true,
        data: {
          ...campaign.toObject(),
          vouchers,
        },
        message: 'Lấy thông tin chiến dịch thành công',
      }
    }

    // PUT - Update campaign
    if (method === 'PUT') {
      const body = await readBody(event)
      const campaign = await CampaignModel.findByIdAndUpdate(id, body, { new: true })

      if (!campaign) {
        return {
          status: false,
          message: 'Không tìm thấy chiến dịch',
        }
      }

      return {
        status: true,
        data: campaign,
        message: 'Cập nhật chiến dịch thành công',
      }
    }

    // DELETE - Delete campaign
    if (method === 'DELETE') {
      // Check if campaign has vouchers
      const voucherCount = await VoucherModel.countDocuments({ campaign: id })
      if (voucherCount > 0) {
        return {
          status: false,
          message: 'Không thể xóa chiến dịch có voucher. Vui lòng xóa các voucher trước.',
        }
      }

      await CampaignModel.findByIdAndDelete(id)

      return {
        status: true,
        message: 'Xóa chiến dịch thành công',
      }
    }

    return {
      status: false,
      message: 'Method not allowed',
    }
  }
  catch (error: any) {
    console.error('Campaign Detail API Error:', error)
    return {
      status: false,
      message: error.message || 'Lỗi server',
    }
  }
})
