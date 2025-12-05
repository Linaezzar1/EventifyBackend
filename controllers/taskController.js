const Task = require('../models/Task');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

exports.createTask = async (req, res) => {
    try {
        const { title, description, status, assignedTo, dueDate, type, priority } = req.body;

        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: 'Evénement non trouvé' });

        const isOrganizer =
            event.createdBy.toString() === req.user._id.toString() ||
            event.organizers.some(o => o.toString() === req.user._id.toString());
        const isLogManager =
            event.logisticManager?.toString() === req.user._id.toString();
        const isComManager =
            event.communicationManager?.toString() === req.user._id.toString();

        if (!isOrganizer && !isLogManager && !isComManager) {
            return res.status(403).json({ message: 'Non autorisé à créer une tâche' });
        }

        const task = new Task({
            title,
            description,
            status,
            assignedTo,
            event: event._id,
            createdBy: req.user._id,
            dueDate,
            type,
            priority,
            reminders: [{
                date: dueDate,
                sent: false
            }]
        });

        await task.save();
        await task.populate('assignedTo createdBy', 'name role email');

        if (assignedTo) {
            await Notification.create({
                receiver: assignedTo,
                sender: req.user._id,
                type: 'rappel_tache',
                event: event._id,
                task: task._id,
                message: `Nouvelle tâche assignée: ${task.title}`
            });
        }

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
        const task = await Task.findById(req.params.taskId).populate('event');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const event = task.event;
        const isOrganizer =
            event.createdBy.toString() === req.user._id.toString() ||
            event.organizers.some(o => o.toString() === req.user._id.toString());
        const isLogManager =
            event.logisticManager?.toString() === req.user._id.toString();
        const isComManager =
            event.communicationManager?.toString() === req.user._id.toString();
        const isAssignee =
            task.assignedTo?.toString() === req.user._id.toString();

        const { title, description, status, assignedTo, dueDate, priority } = req.body;

        // le staff peut seulement changer son statut (a_faire/en_cours/termine)
        if (isAssignee && !isOrganizer && !isLogManager && !isComManager) {
            if (status) task.status = status;
        } else if (isOrganizer || isLogManager || isComManager) {
            if (title !== undefined) task.title = title;
            if (description !== undefined) task.description = description;
            if (status !== undefined) task.status = status;
            if (assignedTo !== undefined) task.assignedTo = assignedTo;
            if (dueDate !== undefined) task.dueDate = dueDate;
            if (priority !== undefined) task.priority = priority;
        } else {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // si la tâche est en retard
        if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'termine') {
            task.status = 'en_retard';
            task.sanctions.push({
                user: task.assignedTo,
                reason: 'Tâche non terminée à temps'
            });

            if (task.assignedTo) {
                await Notification.create({
                    receiver: task.assignedTo,
                    sender: req.user._id,
                    type: 'alerte_retard',
                    event: event._id,
                    task: task._id,
                    message: `Tâche en retard: ${task.title}`
                });
            }
        }

        await task.save();
        await task.populate('assignedTo createdBy', 'name role email');
        res.json(task);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.taskId).populate('event');
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const event = task.event;
        const isOrganizer =
            event.createdBy.toString() === req.user._id.toString() ||
            event.organizers.some(o => o.toString() === req.user._id.toString());
        const isManager =
            event.logisticManager?.toString() === req.user._id.toString() ||
            event.communicationManager?.toString() === req.user._id.toString();

        if (!isOrganizer && !isManager) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        await Task.deleteOne({ _id: req.params.taskId });
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

