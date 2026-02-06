// const {getLanguageById, submitBatch, submitToken} = require("../utils/problemUtility");
const problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission"); //  i have Fixed the import of Submission
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req, res) => {
    try {
        const {
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases,
            startCode,
            refrenceSolution
        } = req.body;

        console.log(' Received data:', req.body);

        // Basic validation
        if (!title || !description || !difficulty || !tags || !visibleTestCases) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                received: req.body 
            });
        }

        // Create problem WITHOUT validation for now
        const userProblem = await problem.create({
            title,
            description,
            difficulty,
            tags,
            visibleTestCases,
            hiddenTestCases: hiddenTestCases || [],
            startCode,
            refrenceSolution,
            problemCreator: req.user?._id || req.result?._id || '65d4a1b2c8e9f01234567890' // temporary
        });

        console.log(' Problem created:', userProblem._id);
        res.status(201).json({ 
            success: true, 
            message: 'Problem created successfully',
            problemId: userProblem._id 
        });

    } catch (err) {
        console.error(' Error creating problem:', err);
        res.status(400).json({ 
            error: err.message,
            stack: err.stack 
        });
    }
};

const updateProblem = async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        refrenceSolution,
        problemCreator
    } = req.body;

    try {
        if (!id) return res.status(400).send("Missing ID Field");

        const existingProblem = await problem.findById(id);
        if (!existingProblem) return res.status(404).send("ID is not present in server");

        // Update the problem
        const updatedProblem = await problem.findByIdAndUpdate(
            id,
            {
                title,
                description,
                difficulty,
                tags,
                visibleTestCases,
                hiddenTestCases,
                startCode,
                refrenceSolution,
                problemCreator
            },
            { runValidators: true, new: true }
        );

        res.status(200).send(updatedProblem);
    } catch (err) {
        res.status(400).send("Error: " + err);
    }
};

const deleteProblem = async(req,res)=>{
   const {id} = req.params;
   try{
    if(!id)  
      return res.status(400).send("ID is missing");

    const deletedProblem = await problem.findByIdAndDelete(id);
    if(!deletedProblem)
       return res.status(404).send("Problem is missing");

    res.status(200).send("Successfully deleted");
   }
   catch(err){
    res.status(500).send("Error: "+err);
   }
}

const getProblemById = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) return res.status(400).send("ID is missing");

    const problemData = await problem.findById(id).select('-hiddenTestCases');
    
    if (!problemData) return res.status(404).send("Problem not found");

    // video ka url yahi le aao 
    const videos = await SolutionVideo.find({ problemId: id});
    console.log(`[getProblemById] Found ${videos?.length || 0} videos for problem ${id}`);
    console.log(`[getProblemById] Videos:`, videos);
    
    const problemObject = problemData.toObject();
    
    if (videos && videos.length > 0){
      console.log(`[getProblemById] First video:`, videos[0]);
      const videoData = videos.map(v => ({
        secureUrl: v.secureUrl,
        cloudinaryPublicId: v.cloudinaryPublicId,
        thumbnailUrl: v.thumbnailUrl,
        duration: v.duration
      }));
      
      // Add first video's data at top level for frontend access
      const responseData = {
        ...problemObject,
        secureUrl: videos[0].secureUrl,
        thumbnailUrl: videos[0].thumbnailUrl,
        duration: videos[0].duration,
        cloudinaryPublicId: videos[0].cloudinaryPublicId,
        videos: videoData
      };
      console.log(`[getProblemById] Returning secureUrl:`, responseData.secureUrl);
      return res.status(200).json(responseData);
    }

    console.log(`[getProblemById] No videos found for problem ${id}, returning problem only`);
    res.status(200).json(problemObject);
  } catch (err) {
    console.error(`[getProblemById] Error:`, err);
    res.status(500).send("Error: " + err);
  }
};

const getAllproblem = async (req, res) => {
  try {
    const allProblems = await problem.find({})
      .select('_id title description tags difficulty');

    if (!allProblems || allProblems.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(allProblems);

  } catch (err) {
    console.error("Error in getAllproblem:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

const solvedAllProblembyUser = async(req,res)=>{
try{
     const userId = req.result._id;
     const userData = await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
     });
     res.status(200).send(userData.problemSolved);
}
catch(err){
  res.status(500).send("Server Error: "+err);
}
}

const submittedProblem = async(req,res)=>{
   try{
      const userId = req.result._id;
      const problemId = req.params.pid;

      const ans = await Submission.find({userId, problemId}); //  Fixed typo

      if(ans.length === 0) {
          return res.status(200).json({ message: "No submission is present" }); //  single response
      }

      return res.status(200).json(ans); //  single response
   }
   catch(err){
      console.error("submittedProblem ERROR:", err);
      return res.status(500).json({ message: "Internal server error", error: err.message });
   }
}

// NEW FUNCTION: Get accepted solutions for a problem
const getProblemSolutions = async (req, res) => {
   try {
     const problemId = req.params.pid;
     const userId = req.result._id;
 
     if (!problemId) {
       return res.status(400).json({ 
         success: false, 
         message: "Problem ID is required" 
       });
     }
 
     // Find all ACCEPTED submissions for this problem
     const solutions = await Submission.find({
       problemId: problemId,
       status: "accepted"  // Only show accepted solutions
     })
     .populate('userId', 'firstName email role')
     .sort({ createdAt: -1 })  // Latest first
     .select('code language userId createdAt runtime memory testCasesPassed testCasesTotal')
     .lean();
 
     // Format the response
     const formattedSolutions = solutions.map(solution => ({
       _id: solution._id,
       code: solution.code,
       language: solution.language,
       explanation: `This ${solution.language} solution passed ${solution.testCasesPassed}/${solution.testCasesTotal} test cases in ${solution.runtime || 0}ms`,
       author: {
         firstName: solution.userId?.firstName || 'Anonymous',
         email: solution.userId?.email,
         role: solution.userId?.role
       },
       createdAt: solution.createdAt,
       runtime: solution.runtime || 0,
       memory: solution.memory || 0,
       testCasesPassed: solution.testCasesPassed || 0,
       testCasesTotal: solution.testCasesTotal || 0
     }));
 
     res.status(200).json({
       success: true,
       solutions: formattedSolutions,
       count: formattedSolutions.length,
       message: `Found ${formattedSolutions.length} accepted solutions`
     });
 
   } catch (err) {
     console.error("getProblemSolutions ERROR:", err);
     res.status(500).json({ 
       success: false,
       message: "Internal server error", 
       error: err.message 
     });
   }
 };

module.exports = {
  createProblem, 
  updateProblem, 
  deleteProblem, 
  getProblemById, 
  getAllproblem, 
  solvedAllProblembyUser, 
  submittedProblem,
  getProblemSolutions  // ADDED: Export the new function
};