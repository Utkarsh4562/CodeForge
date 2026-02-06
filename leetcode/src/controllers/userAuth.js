const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const redisClient = require("../config/redis");

const register = async (req, res) => {
  // now for register function 
  try {
    // validate the data coming from the user 
    validate(req.body);

    const { firstName, emailId, password } = req.body;  // now for password we need hashing and we will use bcrypt library

    req.body.password = await bcrypt.hash(password, 10); // 10 is basically number of iteration or salt rounds 
    req.body.role = 'user'; // by default role will be user 

    // ab agar user ne register kar liya hai to use token bhej de 
    const user = await User.create(req.body); // ye data ko database me store kar dega and agar user register second time with same mail id kare to error aayega because emailId is unique 
    console.log("User saved:", user._id);

    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: 'user' },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    ); // 60*60 means token ek ghante tak valid rahega

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      emailId: user.emailId,
      _id: user._id,
      role:user.role,
    };

    res.cookie('token', token, { maxAge: 60 * 60 * 1000, httpOnly: true, sameSite: 'Lax' }); // cookie frontend me 3600 second ke baad expire ho jayegi 

    res.status(201).json({
      user: reply,
      message: "User registered successfully"
    });
  } catch (err) {
    console.error("Register error:", err); // debug log
    res.status(400).json({ message: err.message }); // 400 means bad request
  }
};

// now for login function 
const login = async (req, res) => {
  try {
    const { emailId, password } = req.body; // jab user login karega tab vo do cheeze dega emailId and password 
    if (!emailId) throw new Error("Invalid Credentials"); 
    if (!password) throw new Error("Invalid Credentials"); 

    const user = await User.findOne({ emailId }); // database me se user ko dhundenge emailId ke basis par 
    if (!user) throw new Error("Invalid Credentials");

    const match = await bcrypt.compare(password, user.password); // check karega ki password match kar raha hai ki nahi 
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
    res.status(200).json({
      user: reply,
      message: "Login successful"
    }); // 200 means OK
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({ message: err.message }); // 401 means unauthorized
  }
};

// now for logout function 
const logout = async (req, res) => {
  try {
    const token = req.cookies.token; // jo token cookie me hoga use lenge 
    const payload = jwt.decode(token); // token ko decode karenge taki hame pata chal jaye ki token me kya info hai 

    await redisClient.set(`token:${token}`, 'Blocked'); // token ko redis ke blocklist me add kar diye 
    await redisClient.expireAt(`token:${token}`, payload.exp); // token expire hone ke baad redis se bhi delete ho jayega 

    res.cookie("token", null, { expires: new Date(Date.now()) }); // cookie ko null kar denge taki turant expire ho jaye 
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
    res.status(201).json({ user: reply, message: "Admin registered successfully" });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(400).json({ message: err.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    // userSchema se user ko delete karenge 
    const userId = req.result._id;
    await User.findByIdAndDelete(userId); 

    // submission se bhi delete karenge jisme ye user ne submit kiya hai 
    // await Submission.deleteMany({ userId }); 

    res.status(200).send("Deleted profile successfully");
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).send("Internal server Error");
  }
};

module.exports = { register, login, logout, adminRegister, deleteProfile };
