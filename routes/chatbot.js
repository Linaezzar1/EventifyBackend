const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { authMiddleware } = require('../middlewares/auth');

// Route pour discuter avec le chatbot (protégée par authentification)
// POST /api/chatbot/chat
router.post('/chat', authMiddleware, chatbotController.chatWithBot);

module.exports = router;
