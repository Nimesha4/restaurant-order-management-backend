const express = require('express');
const router = express.Router();
const {
  createUserDetails,
  updateOrderStatus,
  getUserDetailsByUserId
} = require('../controllers/userDetailsController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/userdetails', authMiddleware, createUserDetails);
router.put('/userdetails/:id/status', authMiddleware, updateOrderStatus);
router.get('/userdetails/:id', authMiddleware, getUserDetailsByUserId);

module.exports = router;
