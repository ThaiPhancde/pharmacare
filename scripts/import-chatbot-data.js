#!/usr/bin/env node

// Import the required libraries
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Function to display formatted message
function displayMessage(message, type = 'info') {
  const colors = {
    info: '\x1b[36m%s\x1b[0m', // Cyan
    success: '\x1b[32m%s\x1b[0m', // Green
    error: '\x1b[31m%s\x1b[0m', // Red
    warning: '\x1b[33m%s\x1b[0m' // Yellow
  };

  console.log(colors[type], message);
}

// Function to make API call using curl
function makeApiCall(url, method = 'GET') {
  try {
    const baseUrl = 'http://localhost:3000';
    const fullUrl = `${baseUrl}${url}`;
    
    displayMessage(`Making ${method} request to ${fullUrl}...`);
    
    const result = execSync(`curl -X ${method} ${fullUrl} -s`);
    return JSON.parse(result.toString());
  } catch (error) {
    displayMessage(`API call failed: ${error.message}`, 'error');
    return { success: false, message: error.message };
  }
}

// Check if Medicine.txt exists
function checkMedicineFile() {
  const filePath = path.resolve(process.cwd(), 'Medicine.txt');
  if (!fs.existsSync(filePath)) {
    displayMessage('Medicine.txt not found. Please make sure the file exists in the root directory.', 'error');
    return false;
  }
  return true;
}

// Check if database exports exist
function checkDatabaseExports() {
  const chatbotsPath = path.resolve(process.cwd(), 'database/pharmacare.chatbots.json');
  if (!fs.existsSync(chatbotsPath)) {
    displayMessage('pharmacare.chatbots.json not found in the database directory.', 'warning');
    return false;
  }
  return true;
}

// Main function to run the import
async function main() {
  try {
    displayMessage('Starting PharmaCare Chatbot data import...', 'info');
    
    // Check for required files
    const hasMedicineFile = checkMedicineFile();
    const hasDatabaseExports = checkDatabaseExports();
    
    if (!hasMedicineFile && !hasDatabaseExports) {
      displayMessage('No data sources found. Import aborted.', 'error');
      process.exit(1);
    }
    
    // Import from Medicine.txt
    if (hasMedicineFile) {
      displayMessage('Importing data from Medicine.txt...', 'info');
      const medicineResult = makeApiCall('/api/chatbot/parse-medicine-data', 'POST');
      
      if (medicineResult.success) {
        displayMessage(`Successfully imported ${medicineResult.data.length} QA pairs from Medicine.txt`, 'success');
      } else {
        displayMessage(`Failed to import from Medicine.txt: ${medicineResult.message}`, 'error');
      }
    }
    
    // Import from database exports
    if (hasDatabaseExports) {
      displayMessage('Importing data from database exports...', 'info');
      const dbResult = makeApiCall('/api/chatbot/import-database-data', 'POST');
      
      if (dbResult.success) {
        displayMessage(`Successfully imported ${dbResult.data.total} QA pairs (${dbResult.data.fromDb} from database, ${dbResult.data.fromText} from Medicine.txt)`, 'success');
      } else {
        displayMessage(`Failed to import from database: ${dbResult.message}`, 'error');
      }
    }
    
    displayMessage('Import process completed.', 'success');
  } catch (error) {
    displayMessage(`Import process failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main(); 