const express = require('express');
const { deleteUser } = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
