const cloudinary = require('cloudinary').v2;
const Problem = require("../models/problem");
const User = require("../models/user");
const SolutionVideo = require("../models/solutionVideo");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUpLoadSignature = async(req,res)=>{
    try{
        const { problemId } = req.params;
        const userId = req.result._id;
        // verify problem exists

        const problem = await Problem.findById(problemId);
        if(!problem){
            return res.status(404).json({ error:'problem not found'});
        }

        // generate uniquie public_id for the video 
        const timestamp = Math.round(new Date().getTime()/ 1000);
        const publicId = `leetcode-solution/${problemId}/${userId}_${timestamp}`;

        // upload parameters
        const uploadParams = {
            timestamp: timestamp,
            public_id: publicId,
        };

        // generate signature 
        const signature = cloudinary.utils.api_sign_request(  // upload ke parameters ko digitaly sign kardiya aur isko sign kiya hai CLOUDINARY_API_SECRET se 
            uploadParams,
            process.env.CLOUDINARY_API_SECRET
        );
           res.json({
            signature,
            timestamp,
            public_id: publicId,
            api_key: process.env.CLOUDINARY_API_KEY,
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`, // v1_1 is bassically version of cloudinary API  

           });
    }catch(error){
        console.log("Error generating upload signature:", error);
        res.status(500).json({ error:'Failed to generate upload credentials'})
    } 
};

const saveVideoMetadata = async(req,res) =>{
        try{
        const {
            problemId,
            cloudinaryPublicId,
            secureUrl,
            duration,
        } = req.body;
        const userId = req.result._id;
        const CloudinaryResource = await cloudinary.api.resource(
            cloudinaryPublicId,
            { resource_type: 'video' }
        );
        if(!CloudinaryResource){
            return res.status(400).json({ error: 'video not found on Cloudinary'});
        }
     const existingVideo =await SolutionVideo.findOne({
            problemId,
            userId,
            cloudinaryPublicId
        });
        
        if(existingVideo) {
            return res.status(400).json({ error: 'video already exists'});
        }
          const thumbnailUrl = cloudinary.url(CloudinaryResource.public_id,{
            resource_type: 'video',
            transformation: [
                {width: 400, height: 225,crop: 'fill' },
                {quality: 'auto' },
                {start_offset: 'auto' }
            ],
            format: 'jpg'
          });
        const videoSolution =  await SolutionVideo.create({
            problemId,
            userId,
            cloudinaryPublicId,
            secureUrl,
            duration: CloudinaryResource.duration || duration,
            thumbnailUrl
        });

        
        res.status(201).json({
            message: 'Video solution saved successfully',
            videoSolution:{
                id: videoSolution._id,
                thumbnailUrl: videoSolution.thumbnailUrl,
                duration: videoSolution.duration,
                uploadedAt: videoSolution.createdAt
            }
        });
        }
        catch(error){
         console.error("Error saving video metadata:", error);
         res.status(500).json({ error: 'failed to save video metadata'});
        }
};

const deleteVideo = async (req,res) =>{
    try{
         const { problemId } = req.params;
         const userId = req.result._id;

         const video = await SolutionVideo.findOneAndDelete({problemId:problemId});

         if(!video){
            return res.status(404).json({ error: 'video not found '});
         }
         await cloudinary.uploader.destroy(video.cloudinaryPublicId,{ resource_type: 'video', invalidate: true});
         res.json({ message: 'video deleted successfully'});
    }
    catch(error){
    console.error('Error deleting video:', error);
    res.status(500).json({ errror: 'failed to delete video'});
    }
};

module.exports = {generateUpLoadSignature,saveVideoMetadata,deleteVideo};