const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optionnel : système ou user
  type: {
    type: String,
    enum: ['rappel_tache', 'validation_inscription', 'changement_horaire', 'alerte_retard'],
    required: true
  },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  message: String,
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
