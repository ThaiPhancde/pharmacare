import Customer from "@/server/models/Customer";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    try {
      const query = getQuery(event);
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const skip = (page - 1) * limit;

      console.log(`Fetching customers - Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

      const [data, total] = await Promise.all([
        Customer.find().skip(skip).limit(limit).lean(),
        Customer.countDocuments(),
      ]);

      console.log(`Found ${data.length} customer records out of ${total} total`);
      
      // Process each customer record to ensure proper structure
      const processedData = data.map(customer => {
        // Ensure medical_profile properties are arrays
        if (customer.medical_profile) {
          if (!Array.isArray(customer.medical_profile.chronic_conditions)) {
            customer.medical_profile.chronic_conditions = [];
          }
          if (!Array.isArray(customer.medical_profile.allergies)) {
            customer.medical_profile.allergies = [];
          }
          if (!Array.isArray(customer.medical_profile.current_medications)) {
            customer.medical_profile.current_medications = [];
          }
        } else {
          // Create empty medical_profile if missing
          customer.medical_profile = {
            chronic_conditions: [],
            allergies: [],
            current_medications: []
          };
        }
        return customer;
      });

      return {
        data: processedData,
        total,
        status: true,
        message: "Get data successfully",
      };
    } catch (error) {
      console.error("Error fetching customers:", error);
      return {
        data: [],
        total: 0,
        status: false,
        message: error instanceof Error ? error.message : "Failed to fetch customers",
      };
    }
  }

  if (method === "POST") {
    return {
      status: false,
      message: "Customers are created automatically from invoices. Manual creation is disabled.",
    };
  }
});
