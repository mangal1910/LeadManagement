const express = require('express');
const router = express.Router();
const {
  createPublicLead,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addNote,
  getLeadActivity
} = require('../controllers/leadController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

// Public route for lead capture
router.post('/public', createPublicLead);

// Protected routes (All require verifyToken)
router.use(verifyToken);

router.route('/')
  .get(getLeads)
  .post(createLead);

router.route('/:id')
  .get(getLeadById)
  .put(updateLead)
  .delete(requireAdmin, deleteLead);

router.post('/:id/notes', addNote);
router.get('/:id/activity', getLeadActivity);

module.exports = router;
