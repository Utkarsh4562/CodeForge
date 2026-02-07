const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const redisClient = require("../config/redis");

const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, emailId, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'user';

    const user = await User.create(req.body);
    console.log("User saved:", user._id);

    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: 'user' },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax' });

    // ✅ TOKEN IN RESPONSE
    res.status(201).json({
      user: reply,
      token: token,  // ← ADDED
      message: "User registered successfully"
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;
    if (!emailId) throw new Error("Invalid Credentials"); 
    if (!password) throw new Error("Invalid Credentials"); 

    const user = await User.findOne({ emailId });
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid Credentials");

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role
    };

    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie('token', token, { maxAge: 60 * 60 * 1000, sameSite: 'Lax' });
    
    // ✅ TOKEN IN RESPONSE
    res.status(200).json({
      user: reply,
      token: token,  // ← ADDED
      message: "Login successful"
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ message: err.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    const payload = jwt.decode(token);

    await redisClient.set(`token:${token}`, 'Blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("User logged out successfully");
  } catch (err) {
    console.error("Logout error:", err);
    res.status(401).json({ message: err.message });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { firstName, emailId, password } = req.body;
    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = 'admin';

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      _id: user._id,
      role: user.role
    };

    res.cookie('token', token, { maxAge: 60 * 60 * 1000, sameSite: 'Lax' });
    
    // ✅ TOKEN IN RESPONSE
    res.status(201).json({ 
      user: reply, 
      token: token,  // ← ADDED
      message: "Admin registered successfully" 
    });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(400).json({ message: err.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    await User.findByIdAndDelete(userId);
    res.status(200).send("Deleted profile successfully");
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).send("Internal server Error");
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };