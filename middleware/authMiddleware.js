
const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET;

    if (!secretKey) {
        return res.status(500).json({ message: 'Server configuration error: missing secret key' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);

        req.user = {
            userId: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            email: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
        };

        console.log("Decoded user:", req.user);

        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
       
      next();
    };
  }
  
module.exports = { authMiddleware, authorizeRoles };

