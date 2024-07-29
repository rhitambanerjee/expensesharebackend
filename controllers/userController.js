const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModels");

exports.signUp = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: "Please input all the required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists" });
    }

    // Hash password
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10); // Convert to number
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Save user to database
    await newUser.save();

    return res
      .status(201)
      .json({ message: "User Created Successfully", newUser });
  } catch (e) {
    console.log(e.message);
    return res.status(500).json({ message: "Error creating user" });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Check If The Input Fields are Valid
    if (!name || !password) {
      return res
        .status(400)
        .json({ message: "Please input username and password" });
    }

    // Check If User Exists In The Database
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare Passwords
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, username: user.name },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res
      .status(200)
      .json({ message: "Login successful", data: { user, token } });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Error during login" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    // Retrieve all users from the database
    const users = await User.find({}, { password: 0 }); // Exclude the password field from the response

    return res.status(200).json({ users });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Error fetching users" });
  }
};
