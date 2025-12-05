const Event = require('../models/Event');
const Notification = require('../models/Notification');
const Task = require('../models/Task');


exports.createEvent = async (req, res) => {
    const { title, description, date, location,
        logisticManager, communicationManager, visibility } = req.body;

    try {
        const event = new Event({
            title,
            description,
            date: new Date(date),
            location,
            createdBy: req.user._id,
            organizers: [req.user._id],
            logisticManager,
            communicationManager,
            visibility
        });
        await event.save();
        await event.populate('createdBy', 'name email role');
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('createdBy', 'name email role');
        res.json(events);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('logisticManager communicationManager', 'name email role');

    if (!event) {
      return res.status(404).json({ message: 'Evénement non trouvé' });
    }

    const tasks = await Task.find({ event: event._id })
      .populate('assignedTo createdBy', 'name email role');

    const now = new Date();
    const ops = [];

    for (const task of tasks) {
      const isOverdue =
        task.dueDate &&
        task.dueDate < now &&
        task.status !== 'termine' &&
        task.status !== 'en_retard';

      if (isOverdue) {
        task.status = 'en_retard';
        task.sanctions.push({
          user: task.assignedTo,
          reason: 'Tâche non terminée à temps'
        });

        if (task.assignedTo) {
          ops.push(Notification.create({
            receiver: task.assignedTo,
            sender: req.user?._id, // sécurise si req.user est absent
            type: 'alerte_retard',
            event: event._id,
            task: task._id,
            message: `Tâche en retard: ${task.title}`
          }));
        }

        ops.push(task.save());
      }
    }

    if (ops.length > 0) {
      await Promise.all(ops);
    }

    // Unique réponse
    return res.status(200).json({ event, tasks });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Evénement non trouvé' });

        const isOrganizer =
            event.createdBy.toString() === req.user._id.toString() ||
            event.organizers.some(o => o.toString() === req.user._id.toString());

        if (!isOrganizer) {
            return res.status(403).json({ message: 'Non autorisé' });
        }

        const { title, description, date, location,
            logisticManager, communicationManager, status, visibility } = req.body;

        if (title !== undefined) event.title = title;
        if (description !== undefined) event.description = description;
        if (date !== undefined) event.date = new Date(date);
        if (location !== undefined) event.location = location;
        if (status !== undefined) event.status = status;
        if (visibility !== undefined) event.visibility = visibility;
        if (logisticManager !== undefined) event.logisticManager = logisticManager;
        if (communicationManager !== undefined) event.communicationManager = communicationManager;

        await event.save();
        await event.populate('createdBy', 'name email role');
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.deleteEvent = async (req, res) => {
    try {
        console.log("Suppression event id:", req.params.id, "par user", req.user._id);

        const event = await Event.findById(req.params.id);
        if (!event) {
            console.log("Event not found");
            return res.status(404).json({ message: 'Evénement non trouvé' });
        }

        // Vérif autorisation : créateur ou autre organisateur
        const isOrganizer =
            event.createdBy.toString() === req.user._id.toString() ||
            event.organizers?.some(o => o.toString() === req.user._id.toString());

        if (!isOrganizer) {
            console.log("Refus suppression : non autorisé !");
            return res.status(403).json({ message: 'Non autorisé' });
        }

        // Récupérer tous les utilisateurs concernés par l'event
        const receiversSet = new Set();

        if (event.createdBy) receiversSet.add(event.createdBy.toString());
        event.organizers?.forEach(o => receiversSet.add(o.toString()));
        if (event.logisticManager) receiversSet.add(event.logisticManager.toString());
        if (event.communicationManager) receiversSet.add(event.communicationManager.toString());
        event.participants?.forEach(p => receiversSet.add(p.toString()));
        event.logisticStaff?.forEach(u => receiversSet.add(u.toString()));
        event.communicationStaff?.forEach(u => receiversSet.add(u.toString()));


        const receivers = Array.from(receiversSet);

        // Créer les notifications "event supprimé"
        const notifDocs = receivers.map(userId => ({
            receiver: userId,
            sender: req.user._id,
            type: 'changement_horaire', // ou un type dédié ex: 'event_supprime'
            event: event._id,
            message: `L'événement "${event.title}" a été supprimé`
        }));

        if (notifDocs.length > 0) {
            await Notification.insertMany(notifDocs);
        }

        // Supprimer l'event
        await Event.deleteOne({ _id: req.params.id });

        console.log("Evénement supprimé avec succès");
        res.json({ message: 'Evénement supprimé et notifications envoyées' });
    } catch (err) {
        console.error("Erreur lors de la suppression :", err);
        res.status(500).json({ message: err.message });
    }
};
exports.joinEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Evénement non trouvé" });

        if (event.participants.includes(req.user._id)) {
            return res.status(400).json({ message: "Déjà inscrit" });
        }
        event.participants.push(req.user._id);
        await event.save();

        await Notification.create({
            receiver: event.createdBy,
            sender: req.user._id,
            type: 'validation_inscription',
            event: event._id,
            message: `${req.user.name} rejoind l'événement`
        });
        await Notification.create({
            receiver: req.user._id,
            sender: event.createdBy,
            type: 'validation_inscription',
            event: event._id,
            message: `vous avez rejoind l'événement`
        });

        res.json({ message: "Inscription réussie" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.leaveEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: "Evénement non trouvé" });

        event.participants = event.participants.filter(
            p => p.toString() !== req.user._id.toString()
        );

        await event.save();

        res.json({ message: "Désinscription réussie" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('participants', 'name email role');
        if (!event) return res.status(404).json({ message: 'Evénement non trouvé' });
        res.json(event.participants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



