const jwt = require('jsonwebtoken');
const User = require("../models/user");
const redisClient = require("../config/redis");

const userMiddleware = async (req, res, next) => {
    try {
        console.log('🔍 UserMiddleware Debug Start');
        console.log('Headers:', req.headers);
        console.log('Cookies:', req.cookies);
        
        // 1. Get token from HEADER (Bearer token)
        const authHeader = req.headers.authorization;
        console.log('Authorization Header:', authHeader);
        
        let token;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // Token from Authorization header
            token = authHeader.substring(7);
            console.log('✅ Token from Authorization header:', token.substring(0, 20) + '...');
        } else if (req.cookies && req.cookies.token) {
            // Token from cookies (for backward compatibility)
            token = req.cookies.token;
            console.log('✅ Token from cookies:', token.substring(0, 20) + '...');
        } else {
            console.log('❌ No token found in headers or cookies');
            return res.status(401).json({ 
                error: "Access denied. No token provided.",
                hint: "Send token in Authorization header as: Bearer <token>"
            });
        }
        
        // 2. Verify JWT token
        console.log('🔑 Verifying token...');
        const payload = jwt.verify(token, process.env.JWT_KEY);
        console.log('✅ Token payload:', payload);
        
        const { _id } = payload;
        if (!_id) {
            console.log('❌ No user ID in token payload');
            return res.status(401).json({ error: "Invalid token: No user ID" });
        }
        
        // 3. Find user in database
        console.log('👤 Finding user in DB:', _id);
        const user = await User.findById(_id);
        if (!user) {
            console.log('❌ User not found in database');
            return res.status(401).json({ error: "User not found" });
        }
        
        // 4. Check Redis for blocked token (optional)
        try {
            const isBlocked = await redisClient.exists(`token:${token}`);
            if (isBlocked) {
                console.log('❌ Token is blocked in Redis');
                return res.status(401).json({ error: "Token is blocked" });
            }
        } catch (redisError) {
            console.log('⚠️ Redis not available, skipping token block check');
            // Continue without Redis check
        }
        
        // 5. Attach user to request (BOTH formats for compatibility)
        console.log('✅ Authentication successful for user:', user.emailId);
        req.user = user;      // Standard format
        req.result = user;    // Your existing format
        
        next();
    } catch(err) {
        console.error('❌ UserMiddleware Error:', err.name, err.message);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: "Invalid token",
                details: err.message 
            });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: "Token expired",
                details: "Login again to get new token"
            });
        }
        
        res.status(401).json({ 
            error: "Authentication failed",
            details: err.message 
        });
    }
}

module.exports = userMiddleware;