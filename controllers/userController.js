const User = require('../models/User');
const Event = require('../models/Event');

exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    // Suppression des événements créés par ce user
    await Event.deleteMany({ createdBy: id });
    // Suppression du user
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'Utilisateur et événements supprimés' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id name email role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


