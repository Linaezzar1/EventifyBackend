const express = require('express');
const router = express.Router();
const { sendMessage, getConversation, getInbox } = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth'); 

router.post('/', authMiddleware, sendMessage);           
router.get('/', authMiddleware, getInbox);               
router.get('/:otherUserId', authMiddleware, getConversation); 

module.exports = router;
