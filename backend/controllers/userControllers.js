const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const { randomString } = require('../utils/random');
const {verifyEmail} = require('../utils/sendEmail');
const statusEnum = require('../enums/status.js');

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic, publicKey } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Fields");
  }

  const code = randomString(20);
  console.log("register",code);
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    pic,
    publicKey,
    verficationCode: code,
    status: 'INACTIVE' // Set user status to pending verification
  });

  const link = `http://localhost:5000/api/user/verify?code=${code}`;
  verifyEmail(email, name, link); // Send verification email to the user

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      publicKey,
      token: generateToken(user._id),
      status:'INACTIVE'

    });
  } else {
    res.status(400);
    throw new Error("User not found");
  }
});

const verifyUser = asyncHandler(async (req, res) => {
  const { code } = req.query;
  console.log("inside verify", code);

  const userExists = await User.findOne({ verificationCode: code });

  if (!userExists) {
    res.status(400);
    throw new Error("Code is invalid");
  }

  userExists.status = 'ACTIVE';
  userExists.verificationCode = "";

  // Save the updated user
  await userExists.save();

  // Send a response page saying "email is verified"
  res.send('<h1>Email is verified</h1>');
});


//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))){
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password");
  }
});

module.exports = { allUsers, registerUser, authUser, verifyUser };
