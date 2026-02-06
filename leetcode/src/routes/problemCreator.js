const express = require('express');
const problemRouter = express.Router();

const adminMiddleware = require("../middleware/adminMiddleware");
const userMiddleware = require("../middleware/userMiddleware");

const {
  createProblem,
  updateProblem,
  deleteProblem,
  getProblemById,
  getAllproblem,
  solvedAllProblembyUser,
  submittedProblem,
  getProblemSolutions  // NEW: Add this import
} = require("../controllers/userProblem");

/* ================= TEST ROUTE ================= */
problemRouter.post('/test', (req, res) => {
  console.log('Test received:', req.body);
  res.json({
    success: true,
    message: 'Backend is working',
    received: req.body
  });
});

/* ================= ADMIN ROUTES ================= */
// Only admin can create, update, delete problems

problemRouter.post("/create", adminMiddleware, createProblem);
problemRouter.put("/update/:id", adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id", adminMiddleware, deleteProblem);

/* ================= USER ROUTES ================= */
// User must be authenticated

// Get single problem by id
problemRouter.get("/problem-by-id/:id", userMiddleware, getProblemById);

// Get all problems
problemRouter.get("/all", userMiddleware, getAllproblem);

// Get how many problems user has solved
problemRouter.get("/solved-by-user", userMiddleware, solvedAllProblembyUser);

// Get submissions of a user for a particular problem
problemRouter.get("/submitted/:pid", userMiddleware, submittedProblem);

// NEW: Get accepted solutions for a problem
problemRouter.get("/solutions/:pid", userMiddleware, getProblemSolutions);

module.exports = problemRouter;