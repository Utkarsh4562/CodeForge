const express = require('express');
const submitRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const {submitCode,runCode} = require("../controllers/userSubmission");



submitRouter.post("/submit/:id", userMiddleware,submitCode); // submit code for a particular problem 
submitRouter.post("/run/:id",userMiddleware,runCode);// runcode for a particular problem

module.exports = submitRouter;