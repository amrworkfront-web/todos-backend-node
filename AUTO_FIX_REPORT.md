Auto-fix completed — 12 files updated — Auth added (JWT+bcrypt) — Inline comments added.

--- FILE: e:/backend/todos/config/db.js ---
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

--- FILE: e:/backend/todos/models/user.js ---
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    f_name: {
      type: String,
      required: true,
    },
    l_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // INFO: Ensures unique emails at the database level
      trim: true,   // IMPROVEMENT: Sanitizes input by removing whitespace
      lowercase: true, // IMPROVEMENT: Normalizes email to lowercase
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

--- FILE: e:/backend/todos/models/todo.js ---
const mongoose = require("mongoose");

const toDoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // IMPROVEMENT: Link todo to a specific user
      ref: "User",
    },
    title: {
      type: String,
      required: true, // FIX: Changed 'require' to 'required'
      trim: true,     // IMPROVEMENT: Remove extra whitespace
    },
    description: {
      type: String,
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // IMPROVEMENT: Adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("ToDo", toDoSchema);

--- FILE: e:/backend/todos/middleware/authMiddleware.js ---
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );

      // Get user from the token and attach to request
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
         return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect: authMiddleware };

--- FILE: e:/backend/todos/middleware/errorMiddleware.js ---
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  res.status(statusCode);

  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };

--- FILE: e:/backend/todos/validators/validation.js ---
const Joi = require("joi");

// Register Validation
const registerSchema = Joi.object({
  f_name: Joi.string().min(2).required(),
  l_name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// Login Validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Todo Validation
const todoSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  status: Joi.boolean(),
});

module.exports = {
  registerSchema,
  loginSchema,
  todoSchema,
};

--- FILE: e:/backend/todos/controllers/authController.js ---
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/user");
const { registerSchema, loginSchema } = require("../validators/validation");

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /register
// @access  Public
const registerUser = async (req, res) => {
  // VALIDATION: Validate request body using Joi
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { f_name, l_name, email, password } = req.body;

  try {
    // CHECK: Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // SECURITY: Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // CREATE: Create user
    const user = await User.create({
      f_name,
      l_name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        f_name: user.f_name,
        l_name: user.l_name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /login
// @access  Public
const loginUser = async (req, res) => {
  // VALIDATION: Validate request body
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { email, password } = req.body;

  try {
    // CHECK: Find user by email
    const user = await User.findOne({ email });

    // SECURITY: Check password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user.id,
        f_name: user.f_name,
        l_name: user.l_name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};

--- FILE: e:/backend/todos/controllers/todoController.js ---
const ToDo = require("../models/todo");
const { todoSchema } = require("../validators/validation");

// @desc    Get todos
// @route   GET /tasks
// @access  Private
const getTodos = async (req, res) => {
  try {
    // PAGINATION: Get page and limit from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // FILTER: Scope to logged-in user
    const todos = await ToDo.find({ user: req.user.id })
      .skip(skip)
      .limit(limit);

    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set todo
// @route   POST /tasks
// @access  Private
const setTodo = async (req, res) => {
  // VALIDATION: Validate request body
  const { error } = todoSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const todo = await ToDo.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      user: req.user.id, // LINK: Associate with user
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update todo
// @route   PUT /tasks/:id
// @access  Private
const updateTodo = async (req, res) => {
  try {
    const todo = await ToDo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    // SECURITY: Ensure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const updatedTodo = await ToDo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // Return the updated document
    );

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete todo
// @route   DELETE /tasks/:id
// @access  Private
const deleteTodo = async (req, res) => {
  try {
    const todo = await ToDo.findById(req.params.id);

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    // SECURITY: Ensure user owns the todo
    if (todo.user.toString() !== req.user.id) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await todo.deleteOne(); // FIX: Used deleteOne instead of remove (deprecated)

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTodos,
  setTodo,
  updateTodo,
  deleteTodo,
};

--- FILE: e:/backend/todos/routes/authRoute.js ---
const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;

--- FILE: e:/backend/todos/routes/todoRoute.js ---
const express = require("express");
const router = express.Router();
const {
  getTodos,
  setTodo,
  updateTodo,
  deleteTodo,
} = require("../controllers/todoController");
const { protect } = require("../middleware/authMiddleware");

// Routes with authentication middleware
router.route("/").get(protect, getTodos).post(protect, setTodo);
router.route("/:id").put(protect, updateTodo).delete(protect, deleteTodo);

module.exports = router;

--- FILE: e:/backend/todos/index.js ---
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

# Change Log
- `config/db.js`: Refactored to use async/await and exit process on failure.
- `models/user.js`: Added email validation/sanitization rules, fixed indenting.
- `models/todo.js`: Fixed `require` typo to `required`, added relation to User model.
- `middleware/authMiddleware.js`: [NEW] Added JWT protection middleware to secure routes.
- `middleware/errorMiddleware.js`: [NEW] Added centralized JSON error handling.
- `validators/validation.js`: [NEW] Added Joi schemas for input validation.
- `controllers/authController.js`: [NEW] Moved logic from routes, added bcrypt hashing, duplicate checks, and JWT generation.
- `controllers/todoController.js`: [NEW] Moved logic from routes, added pagination, and ownership checks.
- `routes/authRoute.js`: [NEW] Defined clean endpoints for `/register` and `/login`.
- `routes/todoRoute.js`: Refactored to use controller methods and protect middleware.
- `index.js`: Cleaned global variables, added middleware usage (cors, parser, error handler), and updated route paths.
- `.env.example`: [NEW] Added example environment variables.
- `routes/registerRoute.js`: [DELETED] Replaced by `authRoute.js`.

# Summary of Fixes
- **Authentication**: Implemented full JWT auth with bcrypt password hashing.
- **Architecture**: Separated Logic (Controllers), Data (Models), and Routing. Added central Error Handling.
- **Security**: Added Input Validation (Joi), user data sanitization, and ownership checks for Todos.
- **Reliability**: Fixed missing `await`s, added try/catch blocks, and fixed Schema definitions.
- **Features**: Added Pagination to GET tasks and User Association (User can only see their own tasks).

# Next Steps
- [ ] Add `rate-limit` middleware to `index.js` to prevent brute force.
- [ ] Add unit/integration tests (Jest/Supertest).
- [ ] Configure strict CORS whitelist for production.
