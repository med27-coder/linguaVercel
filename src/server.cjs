const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Session schema
const sessionSchema = new mongoose.Schema({
  language: String,
  level: String,
  messages: Array,
  corrections: Number,
  createdAt: { type: Date, default: Date.now },
});

const Session = mongoose.model("Session", sessionSchema);

// Save session
app.post("/api/session", async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json({ success: true, id: session._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all sessions
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await Session.find().sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));