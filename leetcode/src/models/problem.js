const mongoose = require('mongoose');
const { Schema } = mongoose;

const problemSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    difficulty: {
        type: String,
        enum: ['easy','medium','hard'],
        required: true,
    },
    tags: {
        type: [String],  // array of strings
        enum: ['array','string','dp','graph','hash-table','stack','math','two-pointers'], 
        required: true
    },
    visibleTestCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }     
    ],
    hiddenTestCases: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    startCode: [
        {
            language: { type: String, required: true },
            initialCode: { type: String, required: true }
        }
    ],
    refrenceSolution: [
        {
            language: { type: String, required: true },
            completeCode: { type: String, required: true }
        }
    ],
    problemCreator: { // spelling fixed
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, { timestamps: true });  // optional but useful

const Problem = mongoose.model("Problem", problemSchema);
module.exports = Problem;
