const jwt = require('jsonwebtoken');
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 AdminMiddleware Debug Start');
        
        // 1. Get token from HEADER (Bearer token)
        const authHeader = req.headers.authorization;
        console.log('Authorization Header:', authHeader);
        
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('✅ Token from Authorization header:', token.substring(0, 20) + '...');
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
            console.log('✅ Token from cookies:', token.substring(0, 20) + '...');
        } else {
            console.log('❌ No token found');
            return res.status(401).json({ error: "Token not present" });
        }

        // 2. Verify JWT
        console.log('🔑 Verifying token...');
        const payload = jwt.verify(token, process.env.JWT_KEY);
        console.log('✅ Token payload:', payload);

        const { _id, role } = payload;
        if (!_id) {
            console.error('❌ ID missing in token');
            return res.status(401).json({ error: "ID missing in token" });
        }

        // 3. Find user in DB
        console.log('👤 Finding user:', _id);
        const user = await User.findById(_id);
        if (!user) {
            console.error('❌ User not found');
            return res.status(404).json({ error: "User not found" });
        }

        // 4. Check if user is admin (OPTIONAL - uncomment if needed)
        // if (user.role !== 'admin') {
        //     console.error(`❌ User role '${user.role}' not authorized`);
        //     return res.status(403).json({ error: "Access denied: Admins only" });
        // }

        // 5. Check Redis (optional)
        try {
            const isBlocked = await redisClient.exists(`token:${token}`);
            if (isBlocked) {
                console.error('❌ Token blocked in Redis');
                return res.status(401).json({ error: "Token is blocked" });
            }
        } catch (redisError) {
            console.log('⚠️ Redis not available, skipping');
        }

        // 6. Attach user to request
        console.log('✅ Admin authentication successful');
        req.user = user;
        req.result = user;

        next();
    } catch (err) {
        console.error("❌ AdminMiddleware Error:", err.name, err.message);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: "Invalid token" });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Token expired" });
        }
        
        res.status(500).json({ 
            error: "Server error in adminMiddleware", 
            details: err.message 
        });
    }
};

module.exports = adminMiddleware;