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
