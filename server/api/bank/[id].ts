import { defineEventHandler, readBody, getRouterParam } from 'h3';
import Bank from '../../models/Bank';
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const method = event.method;

  // GET - Fetch a specific bank account by ID
  if (method === 'GET') {
    try {
      const bank = await Bank.findById(id);
      
      if (!bank) {
        return {
          status: false,
          message: 'Bank account not found'
        };
      }
      
      return {
        data: bank,
        status: true,
        message: 'Get bank account successfully'
      } satisfies IResponse<typeof bank>;
    } catch (error: any) {
      return {
        status: false,
        message: error.message || 'Error getting bank account'
      };
    }
  }

  // PUT - Update a bank account
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.bank_name || !body.account_name || !body.account_number) {
        return {
          status: false,
          message: 'Bank name, account name and account number are required'
        };
      }
      
      // Add updated_at timestamp
      body.updated_at = new Date();
      
      const updatedBank = await Bank.findByIdAndUpdate(id, body, { new: true });
      
      if (!updatedBank) {
        return {
          status: false,
          message: 'Bank account not found'
        };
      }
      
      return {
        data: updatedBank,
        status: true,
        message: 'Bank account updated successfully'
      } satisfies IResponse<typeof updatedBank>;
    } catch (error: any) {
      return {
        status: false,
        message: error.message || 'Error updating bank account'
      };
    }
  }

  // DELETE - Delete a bank account
  if (method === 'DELETE') {
    try {
      const deletedBank = await Bank.findByIdAndDelete(id);
      
      if (!deletedBank) {
        return {
          status: false,
          message: 'Bank account not found'
        };
      }
      
      return {
        data: deletedBank,
        status: true,
        message: 'Bank account deleted successfully'
      } satisfies IResponse<typeof deletedBank>;
    } catch (error: any) {
      return {
        status: false,
        message: error.message || 'Error deleting bank account'
      };
    }
  }

  return {
    status: false,
    message: 'Method not allowed'
  };
}); 