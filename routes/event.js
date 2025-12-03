const express = require('express');
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

const router = express.Router();

router.post('/', authMiddleware, roleMiddleware(['organisateur']), createEvent);
router.put('/:id', authMiddleware, roleMiddleware(['organisateur']), updateEvent);
router.delete('/:id', authMiddleware, roleMiddleware(['organisateur']), deleteEvent);

router.get('/', authMiddleware, getEvents);
router.get('/:id', authMiddleware, getEventById);

router.post('/:id/join', authMiddleware, joinEvent);           
router.delete('/:id/join', authMiddleware, leaveEvent);       
router.get('/:id/participants', authMiddleware, getParticipants);

module.exports = router;
