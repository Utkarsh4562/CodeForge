// config/db.js
const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    // console.log("Connected DB:", mongoose.connection.name);
  } catch (err) {
    console.error("DB connection error:", err.message);
    throw err; // so your main file's .catch runs
  }
}

module.exports = main;
