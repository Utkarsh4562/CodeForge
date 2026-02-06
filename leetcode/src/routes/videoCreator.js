const express = require('express');
const adminMiddleware = require('../middleware/adminMiddleware');
const videoRouter = express.Router();
const {generateUpLoadSignature,saveVideoMetadata,deleteVideo} = require("../controllers/videoSection")

videoRouter.get("/create/:problemId",adminMiddleware,generateUpLoadSignature); // generate upload signature for video upload 
videoRouter.post("/save",adminMiddleware,saveVideoMetadata); // save video metadata to database 
videoRouter.delete("/delete/:problemId",adminMiddleware,deleteVideo); // delete video and its meta data 

module.exports = videoRouter;
