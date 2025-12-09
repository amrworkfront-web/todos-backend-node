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
