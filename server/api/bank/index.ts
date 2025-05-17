import { defineEventHandler, readBody, getQuery } from 'h3';
import Bank from '../../models/Bank';
import { IResponse } from "@/utils/api";

export default defineEventHandler(async (event) => {
  const method = event.method;

  // GET - Fetch all bank accounts
  if (method === 'GET') {
    try {
      const query = getQuery(event);
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const active = query.active === 'true' ? { status: true } : {};
      
      const [data, total] = await Promise.all([
        Bank.find(active).skip(skip).limit(limit).lean(),
        Bank.countDocuments(active),
      ]);
      
      return {
        data,
        total,
        status: true,
        message: 'Get bank accounts successfully'
      };
    } catch (error: any) {
      return {
        data: [],
        total: 0,
        status: false,
        message: error.message || 'Error getting bank accounts'
      };
    }
  }

  // POST - Create a new bank account
  if (method === 'POST') {
    try {
      const body = await readBody(event);
      
      // Validate required fields
      if (!body.bank_name || !body.account_name || !body.account_number) {
        return {
          status: false,
          message: 'Bank name, account name and account number are required'
        };
      }

      // Add created_at timestamp
      body.created_at = new Date();

      const newBank = new Bank(body);
      await newBank.save();
      
      return {
        data: newBank,
        status: true,
        message: 'Bank account created successfully'
      } satisfies IResponse<typeof newBank>;
    } catch (error: any) {
      return {
        status: false,
        message: error.message || 'Error creating bank account'
      };
    }
  }

  // PUT - Update a bank account
  if (method === 'PUT') {
    try {
      const body = await readBody(event);
      
      if (!body.id) {
        return {
          status: false,
          message: 'Bank ID is required'
        };
      }

      const updatedBank = await Bank.findByIdAndUpdate(body.id, body, { new: true });
      if (!updatedBank) {
        return {
          status: false,
          message: 'Bank account not found'
        };
      }
      return {
        status: true,
        message: 'Bank account updated successfully',
        data: updatedBank
      };
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
      const body = await readBody(event);
      
      if (!body.id) {
        return {
          status: false,
          message: 'Bank ID is required'
        };
      }

      const deletedBank = await Bank.findByIdAndDelete(body.id);
      if (!deletedBank) {
        return {
          status: false,
          message: 'Bank account not found'
        };
      }
      return {
        status: true,
        message: 'Bank account deleted successfully'
      };
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