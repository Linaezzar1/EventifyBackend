const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String,

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Organisateur
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  logisticManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  communicationManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  logisticStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  communicationStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  visibility: {
    type: String,
    enum: ['public', 'prive'],
    default: 'public'
  },

  status: {
    type: String,
    enum: ['brouillon', 'publie', 'annule'],
    default: 'brouillon'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
