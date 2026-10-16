const jwt = require('jsonwebtoken');
const config = require('../config/config');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Требуется авторизация' });
        }
        
        const decoded = jwt.verify(token, config.jwtSecret);
        req.adminId = decoded.adminId;
        req.adminEmail = decoded.email;
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Недействительный токен' });
    }
};

module.exports = authMiddleware;
