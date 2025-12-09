const mongoose = require("mongoose");

// REFACTOR: Use an async function for better readability and handling
const dbConnection = async () => {
  try {
    // FIX: Removed deprecated options if any were used (none were, but good practice to keep simple)
    // FIX: Using process.env.MONGODB_URI for standard naming, fallback provided for safety
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/todos");
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // FIX: Exit process with failure if DB connection fails
    process.exit(1);
  }
};

module.exports = dbConnection;