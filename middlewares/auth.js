const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'Utilisateur non trouvé' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token invalide' });
    }
};

const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès interdit: rôle insuffisant' });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };
