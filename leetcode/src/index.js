const express = require('express');
const app = express();
require('dotenv').config();
const main = require('./config/db');
const cookieParser = require('cookie-parser');
const Authrouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter = require("./routes/AiChating");
const videoRouter = require("./routes/videoCreator")
const cors = require('cors');

// Enable CORS for your frontend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/user', Authrouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use("/video",videoRouter);

// Initialize DB + Redis + start server
const InitializeConnection = async () => {
    try {
        await main();

        // Connect Redis with timeout
        const redisPromise = redisClient.connect();
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis timeout')), 5000);
        });

        try {
            await Promise.race([redisPromise, timeout]);
            console.log("Redis connected");
        } catch {
            console.log("Redis not connected, continuing without it");
        }

        console.log("DB connected");
        app.listen(process.env.PORT || 4000, () => {
            console.log("Server is listening at port Number: " + (process.env.PORT || 4000));
        });
    } catch(err) {
        console.log("Error: " + err);
    }
}

InitializeConnection();
