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