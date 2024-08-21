const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const authenticateToken = require("./middleware/authMiddleware");
app.use(cors());
app.use(bodyParser.json());
mongoose
  .connect(
    "mongodb+srv://Amien:12345@cluster0.gului2c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("mongo db connected.");
  })
  .catch((err) => {
    console.log(err, "error");
  });
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, mobileNo, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      mobileNo,
      role,
      password: hashedPassword,
    });
    emailError = '';
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    await newUser.save();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
console.log(user.blocked,"user.blocked");

    if (user.blocked) {
      return res.json({ success: false, message: "User is blocked" });
    }

    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        { id: user._id, role: user.role },
        "your_jwt_secret",
        { expiresIn: "1h" }
      );
      return res.json({ success: true, token, user: user });
    } else {
      return res.json({ success: false, message: "Incorrect password" });
    }
  } catch (err) {
    return res.json({ success: false, message: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find(
      { role: { $ne: "Admin" } },
      "firstName lastName role"
    );
    res.json({ success: true, users });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
app.post("/api/logout", (req, res) => {
  res.json({ success: true });
});
app.post("/api/block-user", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.blocked = true;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});
app.post("/api/unblock-user", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    user.blocked = false;
    await user.save();

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
