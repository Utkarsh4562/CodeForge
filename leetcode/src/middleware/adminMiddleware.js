const jwt = require('jsonwebtoken');
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
    try {
        // 1️⃣ Get token from cookies
        const token = req.cookies.token;
        if (!token) {
            console.error("AdminMiddleware Error: Token not present");
            return res.status(401).json({ error: "Token not present" });
        }

        // 2️⃣ Verify JWT
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_KEY);
        } catch (err) {
            console.error("AdminMiddleware Error: Invalid token", err);
            return res.status(401).json({ error: "Invalid token" });
        }

        const { _id, role } = payload;
        if (!_id) {
            console.error("AdminMiddleware Error: ID missing in token payload");
            return res.status(401).json({ error: "ID missing in token" });
        }

        // 3️⃣ Find user in DB
        const user = await User.findById(_id);
        if (!user) {
            console.error("AdminMiddleware Error: User not found in DB");
            return res.status(404).json({ error: "User not found" });
        }

        // 4️⃣ Check if user is admin
        // if (role !== 'admin') {
        //     console.error(`AdminMiddleware Error: User role '${role}' not authorized`);
        //     return res.status(403).json({ error: "Access denied: Admins only" });
        // }

        // 5️⃣ Check if token is blocked in Redis
        const isBlocked = await redisClient.exists(`token:${token}`);
        if (isBlocked) {
            console.error("AdminMiddleware Error: Token is blocked in Redis");
            return res.status(401).json({ error: "Token is blocked" });
        }

        // 6️⃣ Attach user to request
        req.result = user;

        // ✅ Everything fine, proceed
        next();

    } catch (err) {
        console.error("AdminMiddleware unexpected error:", err);
        res.status(500).json({ error: "Server error in adminMiddleware", details: err.message });
    }
};

module.exports = adminMiddleware;
