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