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

// ✅ IMPROVED CORS CONFIG
const corsOptions = {
  origin: ['https://codeforg.netlify.app', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ✅ REMOVED: Problematic app.options line - CORS middleware already handles OPTIONS
// app.options('/*', cors(corsOptions));  // ⬅️ THIS LINE CAUSES ERROR - REMOVED

// Parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/user', Authrouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);
app.use("/video", videoRouter);

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'CodeForge API is running'
  });
});

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
            console.log("✅ Redis connected");
        } catch {
            console.log("⚠️ Redis not connected, continuing without it");
        }

        console.log("✅ DB connected");
        app.listen(process.env.PORT || 4000, () => {
            console.log("🚀 Server is listening at port: " + (process.env.PORT || 4000));
            console.log("🌐 CORS enabled for:", corsOptions.origin);
        });
    } catch(err) {
        console.log("❌ Error: " + err);
    }
}

InitializeConnection();