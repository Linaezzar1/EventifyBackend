const Message = require('../models/Message');
const User = require('../models/User');

// POST /api/messages
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id; // vient du middleware auth JWT

    if (!receiverId || !content) {
      return res.status(400).json({ message: 'Destinataire et contenu requis.' });
    }

    // Vérifier que le destinataire existe
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Destinataire introuvable.' });
    }

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content
    });

    await message.save();

    res.status(201).json({ message: 'Message envoyé.', data: message });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages/:otherUserId
// Récupère la conversation entre l’utilisateur connecté et otherUserId
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.otherUserId;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/messages
// Boîte de réception simplifiée : derniers messages avec chaque personne
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    res.json({ data: messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
