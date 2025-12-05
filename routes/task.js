// routes/taskRoutes.js
const express = require('express');
const {
    createTask,
    getTasksForEvent,
    updateTask,
    deleteTask
} = require('../controllers/taskController');
const { authMiddleware, roleMiddleware } = require('../middlewares/auth');

const router = express.Router();

// Ici, on part du principe que l'URL inclut l'eventId
router.post(
    '/:eventId',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication']),
    createTask
);

router.get('/:eventId', authMiddleware, getTasksForEvent);

router.put(
    '/:eventId/:taskId',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication', 'participant']),
    updateTask
);

router.delete(
    '/:eventId/:taskId',
    authMiddleware,
    roleMiddleware(['organisateur', 'logistique', 'communication']),
    deleteTask
);

module.exports = router;
