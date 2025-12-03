const Task = require('../models/Task');

exports.createTask = async (req, res) => {
    console.log("BODY task:", req.body);
    try {
        const { title, description, status, assignedTo, dueDate } = req.body;
        const task = new Task({
            title, description, status,
            assignedTo,
            event: req.params.eventId,
            createdBy: req.user._id,
            dueDate
        });
        await task.save();
        await task.populate('assignedTo', 'name role email');
        await task.populate('createdBy', 'name role email');
        console.log("RESPONSE task:", task);
        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTasksForEvent = async (req, res) => {
    try {
        const tasks = await Task.find({ event: req.params.eventId }).populate('assignedTo', 'name role email').populate('createdBy', 'name role email');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        const { title, description, status, assignedTo, dueDate } = req.body;
        task.title = title ?? task.title;
        task.description = description ?? task.description;
        task.status = status ?? task.status;
        task.assignedTo = assignedTo ?? task.assignedTo;
        task.dueDate = dueDate ?? task.dueDate;
        await task.save();
        await task.populate('assignedTo', 'name role email');
        await task.populate('createdBy', 'name role email');
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });
        await Task.deleteOne({ _id: req.params.taskId });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
