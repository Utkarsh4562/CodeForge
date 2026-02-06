const Problem = require("../models/problem"); // Problem schema import
const Submission = require("../models/submission"); // Submission schema import
const User = require("../models/user"); // User model import
const executePiston = require("../utils/coderunner"); // Utility for running code via Piston
const mongoose = require("mongoose");

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id; // req.result ke andar user ki sari information hai
    const problemId = new mongoose.Types.ObjectId(req.params.id); // Convert to ObjectId
    const { code, language } = req.body; // Get code & language from request

    // Validate required fields
    if (!userId || !problemId || !code || !language)
      return res.status(400).send("Some field is missing");

    // Fetch problem to get hidden test cases
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).send("Problem not found");

    // Create initial submission with pending status
    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: "pending", // Enum: pending, accepted, wrong answer, runtime error
      runtime: null,     // To store runtime from Piston
      memory: null,      // To store memory used
      errorMessage: null,// To store error if occurs
      testCasesTotal: problem.hiddenTestCases.length,
      testCasesPassed: 0
    });

    let passedTestCases = 0; // Counter for passed hidden test cases

    // Loop through each hidden test case
    for (let testCase of problem.hiddenTestCases) {
      // Ensure input and output are strings to avoid runtime issues
      const input = testCase.input.toString();
      const expected = testCase.output.toString();

      // Run code using Piston utility
      const result = await executePiston(code, language, input);

      // If Piston returns error, mark submission as runtime error
      if (result.error) {
        submission.status = "runtime error"; // valid enum
        submission.errorMessage = result.error; // store Piston error message
        await submission.save();
        return res.json(submission); // return full submission document
      }

      // Compare output with expected (trim spaces)
      if (result.output.trim() === expected.trim()) passedTestCases++;
    }

    // Update submission with test case results
    submission.testCasesPassed = passedTestCases;
    submission.status =
      passedTestCases === problem.hiddenTestCases.length
        ? "accepted"    // all test cases passed
        : "wrong answer"; // some test cases failed

    // Save updated submission
    await submission.save();

    console.log("Submission Status:", submission.status);
    console.log("Test Cases Passed:", passedTestCases, "Total:", problem.hiddenTestCases.length);

    // problem ko insert karenge userSchema ke problemSolved mein if it is accepted
    if(submission.status === "accepted"){ 
      console.log("Adding to problemSolved", "problemId:", problemId);
      try {
        // Get fresh user data
        const user = await User.findById(req.result._id);
        console.log("User found:", user._id, "Current problemSolved:", user.problemSolved);
        const problemExists = user.problemSolved.some(id => id.equals(problemId));
        if(!problemExists) {
          user.problemSolved.push(problemId);
          const result = await user.save();
          console.log("User saved successfully. New problemSolved:", result.problemSolved);
        } else {
          console.log("Problem already exists in problemSolved");
        }
      } catch (error) {
        console.log("Error adding to problemSolved:", error.message);
      }
    }

    // Return full submission document with all required fields
    return res.json(submission); 

  } catch (err) {
    console.log("SUBMIT ERROR ", err);
    return res.status(500).send("server error");
  }
};

const runCode = async(req,res)=>{
try{
  const userId = req.result._id;
  const problemId = req.params.id;

  const {code, language} = req.body;
    
  if(!userId || !code || !problemId || !language)
    return res.status(400).send("Some field is missing");

  // Fetch the problem from database 
  const problem = await Problem.findById(problemId);
  if(!problem) return res.status(404).send("Problem not found");

  // Run code against visible test cases using Piston API
  const testResults = [];
  
  for(let testCase of problem.visibleTestCases) {
    const input = testCase.input.toString();
    const expected = testCase.output.toString();

    // Run code using Piston utility
    const result = await executePiston(code, language, input);

    // If Piston returns error
    if(result.error) {
      testResults.push({
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        passed: false,
        error: result.error
      });
    } else {
      // Compare output with expected (trim spaces)
      const passed = result.output.trim() === expected.trim();
      testResults.push({
        input: testCase.input,
        expected: testCase.output,
        actual: result.output,
        passed: passed,
        error: null
      });
    }
  }

  res.status(200).json(testResults);

} catch(error) {
  console.log("RUN CODE ERROR ", error);
  return res.status(500).send("Server error: " + error.message);
}
};


module.exports = {submitCode,runCode};


