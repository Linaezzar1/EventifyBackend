const express = require('express');
const router = express.Router();

const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getParticipants
} = require('../controllers/eventController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const {
    createTask,
    getTasksForEvent,
    updateTask,
    deleteTask
} = require('../controllers/taskController');



// Création : uniquement organisateur
router.post('/', authMiddleware, roleMiddleware(['organisateur']), createEvent);

// Liste + détail : tout utilisateur connecté
router.get('/', authMiddleware, getEvents);
router.get('/:id', authMiddleware, getEventById);

// Update / delete : contrôle fin dans le controller (orga ou organisateur ajouté)
router.put('/:id', authMiddleware, roleMiddleware(['organisateur']), updateEvent);

router.delete('/:id', authMiddleware, roleMiddleware(['organisateur']), deleteEvent);

// Inscriptions participant
router.post('/:id/join', authMiddleware, joinEvent);
router.delete('/:id/join', authMiddleware, leaveEvent);
router.get('/:id/participants', authMiddleware, getParticipants);


// ---- Tâches liées à un event ----

router.post(
    '/:eventId/tasks',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication']),
    createTask
);

router.get('/:eventId/tasks', authMiddleware, getTasksForEvent);

router.put(
    '/:eventId/tasks/:taskId',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication', 'participant']),
    updateTask
);

router.delete(
    '/:eventId/tasks/:taskId',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication']),
    deleteTask
);

module.exports = router;
