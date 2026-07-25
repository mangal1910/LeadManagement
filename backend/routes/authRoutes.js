const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, getAllUsers } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, getAllUsers);

module.exports = router;
