# Changelog

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
