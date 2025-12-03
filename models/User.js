const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
    type: String, 
    enum: ['participant', 'organisateur', 'logistique', 'communication'], 
    default: 'participant' 
  }
});

module.exports = mongoose.model('User', userSchema);
