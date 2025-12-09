const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnection = require("./config/db"); // REFACTOR: Extracted config
const authRoutes = require("./routes/authRoute");
const todoRoutes = require("./routes/todoRoute");
const { errorHandler } = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

// Connect to Database
dbConnection();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // SECURITY: Should whitelist domains in production
app.use(express.json()); // PARSER: Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // PARSER: Parse URL-encoded bodies

// Routes
// STRUCTURE: Use RESTful naming conventions
app.use("/api/auth", authRoutes); // Auth routes (register, login)
app.use("/api/tasks", todoRoutes); // Todo routes (protected)

// Error Handler (must be last middleware)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
