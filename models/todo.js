const mongoose = require("mongoose");
const toDoSchema = new mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
  },
  
  status: {
    type: Boolean,
    default: false,   // <-- default value
  },
});
const toDo=mongoose.model("ToDo",toDoSchema)
module.exports=toDo