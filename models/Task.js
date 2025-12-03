const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    status: { type: String, enum: ['en attente', 'en cours', 'fait'], default: 'en attente' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true }, 
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
    dueDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
