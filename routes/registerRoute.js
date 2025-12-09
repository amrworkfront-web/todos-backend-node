const express = require("express");
const route = express.Router();
const user = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

route.post("", async (req, res) => {
  const { f_name, l_name, email, password } = req.body;
  hpassword = await bcrypt.hash(password, 10);
  const newUser = new user({ f_name, l_name, email, password: hpassword });
  newUser.save();

  let token = jwt.sign({ email, id: newUser._id }, process.env.SECRET_KEY, {
    expiresIn: "1w",
  });
  res.status(200).json({message: "to do added successfully", token});
});
module.exports = route;
