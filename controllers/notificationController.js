const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ receiver: req.user._id })
      .sort({ createdAt: -1 })
      .populate('event task', 'title');
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Notification lue' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
