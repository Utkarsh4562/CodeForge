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
    let firstError = null; // Store first error message

    // Loop through each hidden test case
    for (let testCase of problem.hiddenTestCases) {
      try {
        // Ensure input and output are strings to avoid runtime issues
        const input = testCase.input.toString().trim();
        const expected = testCase.output.toString().trim();

        // Run code using Piston utility
        const result = await executePiston(code, language, input);

        // If Piston returns error, mark submission as runtime error
        if (result.error) {
          if (!firstError) {
            firstError = result.error;
          }
          console.log(`Test case failed with error: ${result.error}`);
          continue; // Try next test case to see how many pass
        }

        // Normalize output: trim, convert to string, handle line endings
        const actual = result.output.toString().trim();
        
        // Compare output with expected (trim spaces and normalize line endings)
        if (actual === expected) {
          passedTestCases++;
        } else {
          console.log(`Output mismatch for input "${input}"`);
          console.log(`Expected: "${expected}"`);
          console.log(`Got: "${actual}"`);
        }
      } catch (testError) {
        console.log(`Error running test case: ${testError.message}`);
        if (!firstError) {
          firstError = testError.message;
        }
      }
    }

    // Determine final status
    if (firstError && passedTestCases === 0) {
      submission.status = "runtime error";
      submission.errorMessage = firstError;
    } else if (passedTestCases === problem.hiddenTestCases.length) {
      submission.status = "accepted";
    } else {
      submission.status = "wrong answer";
      submission.errorMessage = firstError || "Some test cases failed";
    }

    // Save updated submission
    await submission.save();

    console.log("Submission Status:", submission.status);
    console.log("Test Cases Passed:", passedTestCases, "Total:", problem.hiddenTestCases.length);

    // Add problem to user's problemSolved if accepted
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
    return res.status(500).send("server error: " + err.message);
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
    try {
      const input = testCase.input.toString().trim();
      const expected = testCase.output.toString().trim();

      // Run code using Piston utility
      const result = await executePiston(code, language, input);

      // Prepare result object
      const testResult = {
        input: testCase.input,
        expected: testCase.output,
        passed: false,
        error: null
      };

      // If Piston returns error
      if(result.error) {
        testResult.actual = null;
        testResult.error = result.error;
      } else {
        // Normalize output
        const actual = result.output.toString().trim();
        testResult.actual = result.output; // Return full output with formatting
        
        // Compare output with expected
        testResult.passed = actual === expected;
        
        if (!testResult.passed) {
          testResult.error = `Output mismatch. Expected: "${expected}", Got: "${actual}"`;
        }
      }

      testResults.push(testResult);
    } catch(testError) {
      testResults.push({
        input: testCase.input,
        expected: testCase.output,
        actual: null,
        passed: false,
        error: testError.message
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


