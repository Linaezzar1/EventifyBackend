const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    const allowedRoles = ['participant', 'organisateur', 'logistique', 'communication'];

    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: 'Rôle invalide' });
    }

    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Email déjà utilisé' });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword, role });
        await user.save();

        res.status(201).json({ message: 'Inscription réussie' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                _id: user._id,
                role: user.role,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

