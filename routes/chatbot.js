const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authMiddleware } = require('../middlewares/auth');

// Route pour discuter avec le chatbot (protégée par authentification)
// POST /api/chatbot/chat
router.post('/chat', authMiddleware, chatbotController.chatWithBot);

// Route alternative plus simple (sans API externe)
// POST /api/chatbot/simple
router.post('/simple', authMiddleware, chatbotController.chatSimple);

module.exports = router;
