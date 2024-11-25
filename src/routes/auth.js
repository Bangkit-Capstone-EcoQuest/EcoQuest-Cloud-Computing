const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();
const invalidatedTokens = new Set();

// Helper function for handling errors
const handleError = (res, status, message, data = null) => {
  const response = { message };
  if (data) response.data = data;
  return res.status(status).json(response);
};

// Route: User Registration
router.post("/register", async (req, res) => {
  const { fullname, no_hp, email, password } = req.body;

  if (!fullname || !no_hp || !email || !password) {
    return handleError(res, 400, "All fields must be filled!");
  }

  try {
    const userExist = await User.findOne({ where: { email } });
    if (userExist) {
      return handleError(res, 400, "Email already exists!");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      no_hp,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registration successful!" });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
      const validationErrors = error.errors.map((err) => ({
        field: err.path,
        message: err.message,
      }));
      return handleError(res, 400, "Validation Error", { errors: validationErrors });
    }

    console.error("Error during registration:", error);
    handleError(res, 500, "Server Error");
  }
});

// Route: User Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return handleError(res, 401, "Invalid email or password");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "365d" }
    );

    res.json({
      message: "Login successful",
      data: {
        userId: user.id,
        name: user.fullname,
        email: user.email,
        photo_url: user.photo_url,
        no_hp: user.no_hp,
        token,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    handleError(res, 500, "Internal server error", {
      error: error.message,
      stack: error.stack,
    });
  }
});

// Route: User Logout
router.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return handleError(res, 401, "Unauthorized: Missing token");
  }

  const token = authHeader.split(" ")[1];

  try {
    invalidatedTokens.add(token);
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Error during logout:", error);
    handleError(res, 401, "Unauthorized: Invalid token");
  }
});

module.exports = router;
