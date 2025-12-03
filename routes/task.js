const express = require('express');
const { createTask, getTasksForEvent, updateTask, deleteTask } = require('../controllers/taskController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.post('/:eventId/tasks', authMiddleware, createTask);
router.get('/:eventId/tasks', authMiddleware, getTasksForEvent);
router.put('/tasks/:taskId', authMiddleware, updateTask);
router.delete('/tasks/:taskId', authMiddleware, deleteTask);

module.exports = router;
