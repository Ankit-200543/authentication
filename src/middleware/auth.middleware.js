const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyAccessToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                message: "Access token missing or malformed" 
            });
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, config.access_token, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ 
                        message: "Access token expired", 
                        expired: true 
                    });
                }
                return res.status(403).json({ 
                    message: "Invalid access token" 
                });
            }

            req.user = decoded; 
            next();
        });
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(500).json({ 
            message: "Internal server error" 
        });
    }
};

module.exports = verifyAccessToken;