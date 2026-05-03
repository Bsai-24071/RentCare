const User = require("../models/User");

const addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating user",
      error: error.message
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({
      message: "Users retrieved successfully",
      users: users
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message
    });
  }
};

module.exports = {
  addUser,
  getUsers
};