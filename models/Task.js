const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  status: {
    type: String,
    enum: ['a_faire', 'en_cours', 'termine', 'en_retard'],
    default: 'a_faire'
  },

  priority: {
    type: String,
    enum: ['basse', 'moyenne', 'haute'],
    default: 'moyenne'
  },

  type: {
    type: String,
    enum: ['logistique', 'communication'],
    required: true
  },

  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // staff logistique/communication
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // orga ou responsable

  dueDate: { type: Date, required: true },

  reminders: [{
    date: Date,
    sent: { type: Boolean, default: false }
  }],

  sanctions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
