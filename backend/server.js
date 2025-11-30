require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("./db");

const app = express();
app.use(express.json());
app.use(cors());

// connect
connectDB();

// Schema
const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  courses: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// token helper
function createToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// Register (returns token)
app.post("/api/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ error: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashed });
    const token = createToken(user);

    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, courses: user.courses } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login (returns token)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = createToken(user);
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, courses: user.courses } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// auth middleware
async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

// dashboard
app.get("/api/dashboard", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// add course
app.post("/api/add-course", auth, async (req, res) => {
  try {
    const { course } = req.body;
    if (!course) return res.status(400).json({ error: "No course provided" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.courses.includes(course)) return res.status(400).json({ error: "Already registered" });

    user.courses.push(course);
    await user.save();
    res.json({ message: "Course added", courses: user.courses });
  } catch (err) {
    res.status(500).json({ error: "Failed to add course" });
  }
});

// remove course
app.post("/api/remove-course", auth, async (req, res) => {
  try {
    const { course } = req.body;
    if (!course) return res.status(400).json({ error: "No course provided" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.courses = user.courses.filter(c => c !== course);
    await user.save();
    res.json({ message: "Course removed", courses: user.courses });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove course" });
  }
});

const path = require("path");

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// For any unknown route → send index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port", PORT));
