# Express Backend Code Review

## 1. General Evaluation
- **Quality**: The code is at a **Beginner** level. It functions for the "happy path" but lacks robustness, error handling, and proper structure.
- **Structure**: The project uses a basic separation of concerns (Routes, Models, Config), which is a good start. However, business logic is tightly coupled within the routes, and there are no Controllers or Services.
- **Maintainability**: Low. Global variables, missing input validation, and lack of error handling would make this code difficult to debug and maintain in a production environment.

## 2. Error Detection
### Critical Bugs & Syntax Errors
- **Schema Validation Typo**: In `models/todo.js`, `require: true` is used instead of `required: true`. Mongoose **will not** enforce validation for the title field.
- **Async/Await Misuse**:
  - In `routes/todoRoute.js` (POST `/`) and `routes/registerRoute.js` (POST `/`), the `.save()` method is called **without** `await`. This is a fire-and-forget operation; the server responds "success" immediately, even if the database write fails later.
  - In `routes/todoRoute.js` (PUT `/:id`), you have `res.send(...).json(...)`. `res.send` ends the response. Calling `.json` afterwards will throw "Error: Can't set headers after they are sent".
- **Global Variable Leaks**:
  - `index.js`: `app = express()` and `PORT = ...` (missing `const` or `let`). These pollute the global namespace.
  - `routes/registerRoute.js`: `hpassword = ...` (missing `const`).
- **Missing Error Handling**: None of the async routes use `try/catch` blocks. Any database error (like a duplicate email or connection failure) will cause an **Unhandled Promise Rejection** and potentially crash the application.

## 3. Security Review
- **Input Validation**: **Critical Missing**. There is no validation of `req.body` (e.g., using Joi or Zod). Users can send arbitrary fields or empty strings.
- **Secrets Management**: Setup is okay using `dotenv`, but ensure `.env` is not committed (checked `.gitignore`, it is good).
- **CORS**: `app.use(cors())` allows requests from **any** origin. For production, you must whitelist specific domains.
- **Rate Limiting**: Missing. The API is vulnerable to brute-force attacks (especially the register route).
- **Authentication**: JWT implementation exists but is basic. The `registerRoute` hardcodes logic that implies a login, but creates a user instead.

## 4. Performance Review
- **Concurrency**: The missing `await` on save operations is a race condition risk.
- **Database Indexing**: `email` is set to `unique: true` which creates an index, which is good.
- **Pagination**: The `GET /tasks` route returns **all** documents (`toDo.find()`). As the dataset grows, this will become a massive performance bottleneck.

## 5. Best Practices
- **Variables**: Always use `const` or `let`. Never implicit globals.
- **Routing**: Logic should be moved to Controllers (`controllers/todoController.js`).
- **REST Conventions**:
  - `res.send("string")` is often mixed with `res.json(obj)`. Stick to one format (preferably JSON) for an API.
  - Status codes are missing in many places (e.g., `201 Created` for POST, `404 Not Found`).
- **Environment**: Usage of `process.env` is correct.

## 6. Fixes & Improvements

### Corrected Model (`models/todo.js`)
```javascript
const mongoose = require("mongoose");

const toDoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true, // FIXED: require -> required
  },
  description: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("ToDo", toDoSchema);
```

### Corrected Route with Controller Logic (`routes/todoRoute.js`)
```javascript
const express = require('express');
const router = express.Router(); // Renamed route -> router (std convention)
const ToDo = require("../models/todo");

// GET ALL
router.get('/', async (req, res) => {
    try {
        const todos = await ToDo.find();
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST
router.post('/', async (req, res) => {
    try {
        const { title, description, status } = req.body;
        // Basic validation
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }
        
        const newTodo = new ToDo({ title, description, status });
        await newTodo.save(); // FIXED: Added await
        
        res.status(201).json({ message: 'Todo added successfully', todo: newTodo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status } = req.body;
        
        const updatedTodo = await ToDo.findByIdAndUpdate(
            id, 
            { title, description, status }, 
            { new: true, runValidators: true }
        );

        if (!updatedTodo) {
            return res.status(404).json({ message: "Task not found" });
        }

        // FIXED: Only one response method
        res.status(200).json({ message: "Task updated successfully", todo: updatedTodo });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTodo = await ToDo.findByIdAndDelete(id);
        
        if (!deletedTodo) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
```

### Server Entry Point (`index.js`)
```javascript
const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');
const dbConnection = require('./config/db');
const todoRoute = require('./routes/todoRoute');
const userRoute = require('./routes/registerRoute');

dotenv.config();

const app = express(); // FIXED: Added const
const PORT = process.env.PORT || 3000; // FIXED: Added const

// Middleware
app.use(cors());
app.use(express.json());

// Database
dbConnection();

// Routes
app.use('/tasks', todoRoute);
app.use('/register', userRoute);

// Global Error Handler (Optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```

## 7. Final Summary
- **Pros**: Simple start, uses standard libraries (Mongoose, Express).
- **Cons**: Broken validation, async race conditions, no error handling, global variable pollution.
- **Overall Rating**: **3/10**
- **Estimated Level**: **Beginner**

**Recommendation**: Focus on understanding JavaScript's asynchronous nature (Promises/async-await) and error handling patterns before adding more features.
