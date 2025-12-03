const Event = require('../models/Event');

exports.createEvent = async (req, res) => {
    const { title, description, date, location } = req.body;
    console.log('event POST body:', req.body);

    try {
        const event = new Event({
            title,
            description,
            date: new Date(date),
            location,
            createdBy: req.user._id
        });
        await event.save();
        // Peuple createdBy avant d'envoyer
        await event.populate('createdBy', 'name email role');
        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
        console.error('event ERR:', err);
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
        const event = await Event.findById(req.params.id).populate('createdBy', 'name email role');
        if (!event) return res.status(404).json({ message: 'Evénement non trouvé' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Evénement non trouvé' });
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé' });
        }
        const { title, description, date, location } = req.body;
        event.title = title ?? event.title;
        event.description = description ?? event.description;
        event.date = date ?? event.date;
        event.location = location ?? event.location;
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
        if (event.createdBy.toString() !== req.user._id.toString()) {
            console.log("Refus suppression : non autorisé !");
            return res.status(403).json({ message: 'Non autorisé' });
        }
        await Event.deleteOne({ _id: req.params.id }); // <-- Correction ici !
        console.log("Evénement supprimé avec succès");
        res.json({ message: 'Evénement supprimé' });
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



