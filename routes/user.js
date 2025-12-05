const express = require('express');
const { deleteUser, getAllUsers } = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');
const router = express.Router();

router.delete('/:id', authMiddleware, deleteUser);
router.get('/', authMiddleware, getAllUsers);

module.exports = router;
