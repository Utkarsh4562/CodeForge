const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    problemId:{
        type: Schema.Types.ObjectId,
        ref: 'problem',
        require: true
    },
    code:{
        type: String,
        require: true,
    },
    language:{
        type: String,
        required: true,
        enum: ['javascript','cpp','java','python'] 
    },
   status: {
  type: String,
  enum: ["pending", "accepted", "wrong answer", "runtime error"],
  default: "pending"
},
 runtime:{    // time complexity in millisecond
        type: Number,
        default: 0
    },
    memory:{  // space complexity
        type: Number, // KB
        default: 0
    },
    errorMessage:{
        type: String,
        default: ''
    },
    testCasesPassed:{
        type: Number,
        default: 0
    },
    testCasesTotal:{ // Recommended addtion 
        type:Number,
        default: 0
    }
},
    {
       timestamps: true // particular submission kis time me create hua hai 
    });


    // now we will do indexing 
    submissionSchema.index({userId:1 , problemId:1}); // userid aur problem id ke basis par compound index ban gaya hai taki query fast ho jaye 

const Submission = mongoose.model('submission',submissionSchema);
module.exports = Submission; 