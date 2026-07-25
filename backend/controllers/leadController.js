const Lead = require('../models/Lead');
const Note = require('../models/Note');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// @desc    Submit lead via public capture form (NO Auth required)
// @route   POST /api/leads/public
// @access  Public
const createPublicLead = async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required fields' });
    }

    const lead = await Lead.create({
      name,
      email,
      phone: phone || '',
      company: company || '',
      status: 'NEW',
      assignedTo: null
    });

    // Automated Activity Log for public submission
    await ActivityLog.create({
      leadId: lead._id,
      userId: null,
      actionType: 'LEAD_CREATED',
      description: 'Lead submitted via public capture form'
    });

    res.status(201).json({
      success: true,
      message: 'Lead captured successfully',
      lead
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get paginated and filtered leads
// @route   GET /api/leads
// @access  Private (ADMIN gets all/filtered; MEMBER gets assigned only)
const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    let queryFilter = {};

    // RBAC: MEMBER can only see their assigned leads
    if (req.user.role === 'MEMBER') {
      queryFilter.assignedTo = req.user._id;
    } else if (req.user.role === 'ADMIN' && req.query.assignedTo) {
      if (req.query.assignedTo === 'unassigned') {
        queryFilter.assignedTo = null;
      } else {
        queryFilter.assignedTo = req.query.assignedTo;
      }
    }

    // Status Filter
    if (req.query.status) {
      queryFilter.status = req.query.status.toUpperCase();
    }

    // Search Filter (name, email, company)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      queryFilter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex }
      ];
    }

    const total = await Lead.countDocuments(queryFilter);

    const leads = await Lead.find(queryFilter)
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: leads.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      },
      leads
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single lead details with Notes & Activity Log
// @route   GET /api/leads/:id
// @access  Private
const getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email role');

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Enforce MEMBER restriction
    if (req.user.role === 'MEMBER' && String(lead.assignedTo?._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied to this lead' });
    }

    const notes = await Note.find({ leadId: lead._id })
      .populate('authorId', 'name email role')
      .sort({ createdAt: -1 });

    const activityLogs = await ActivityLog.find({ leadId: lead._id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      lead,
      notes,
      activityLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create lead manually (Authenticated)
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, status, assignedTo } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    // Non-admins cannot assign leads during creation
    let assignee = null;
    if (req.user.role === 'ADMIN' && assignedTo) {
      assignee = assignedTo;
    }

    const lead = await Lead.create({
      name,
      email,
      phone: phone || '',
      company: company || '',
      status: status || 'NEW',
      assignedTo: assignee
    });

    // Create Activity Log
    await ActivityLog.create({
      leadId: lead._id,
      userId: req.user._id,
      actionType: 'LEAD_CREATED',
      description: `Lead created manually by ${req.user.name}`
    });

    if (assignee) {
      const assignedUser = await User.findById(assignee);
      await ActivityLog.create({
        leadId: lead._id,
        userId: req.user._id,
        actionType: 'ASSIGNMENT',
        description: `Lead assigned to ${assignedUser ? assignedUser.name : 'User'} by ${req.user.name}`
      });
    }

    const populatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email role');

    res.status(201).json({
      success: true,
      lead: populatedLead
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update lead (Status, Assignment, Details) with Automated Activity Logs
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    let lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // MEMBER restriction check
    if (req.user.role === 'MEMBER' && String(lead.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You can only update your assigned leads' });
    }

    const { name, email, phone, company, status, assignedTo } = req.body;

    // Track status change
    if (status && status !== lead.status) {
      await ActivityLog.create({
        leadId: lead._id,
        userId: req.user._id,
        actionType: 'STATUS_CHANGE',
        description: `Status changed from "${lead.status}" to "${status}" by ${req.user.name}`
      });
      lead.status = status;
    }

    // Track assignment change (ADMIN only)
    if (assignedTo !== undefined) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Only Admins can reassign leads' });
      }

      const newAssignedId = assignedTo ? String(assignedTo) : null;
      const currentAssignedId = lead.assignedTo ? String(lead.assignedTo) : null;

      if (newAssignedId !== currentAssignedId) {
        let assigneeName = 'Unassigned';
        if (newAssignedId) {
          const assignee = await User.findById(newAssignedId);
          if (assignee) assigneeName = assignee.name;
        }

        await ActivityLog.create({
          leadId: lead._id,
          userId: req.user._id,
          actionType: 'ASSIGNMENT',
          description: `Lead assigned to ${assigneeName} by ${req.user.name}`
        });
        lead.assignedTo = newAssignedId;
      }
    }

    // General updates
    if (name) lead.name = name;
    if (email) lead.email = email;
    if (phone !== undefined) lead.phone = phone;
    if (company !== undefined) lead.company = company;

    await lead.save();

    const updatedLead = await Lead.findById(lead._id).populate('assignedTo', 'name email role');

    res.status(200).json({
      success: true,
      lead: updatedLead
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lead (ADMIN only)
// @route   DELETE /api/leads/:id
// @access  Private/ADMIN
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await Lead.findByIdAndDelete(req.params.id);
    await Note.deleteMany({ leadId: req.params.id });
    await ActivityLog.deleteMany({ leadId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Lead and associated data deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add note to a lead with automated ActivityLog
// @route   POST /api/leads/:id/notes
// @access  Private
const addNote = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content cannot be empty' });
    }

    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // MEMBER restriction
    if (req.user.role === 'MEMBER' && String(lead.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Cannot add note to this lead' });
    }

    const note = await Note.create({
      leadId: lead._id,
      authorId: req.user._id,
      content: content.trim()
    });

    // Create Activity Log
    await ActivityLog.create({
      leadId: lead._id,
      userId: req.user._id,
      actionType: 'NOTE_ADDED',
      description: `Note added by ${req.user.name}`
    });

    const populatedNote = await Note.findById(note._id).populate('authorId', 'name email role');

    res.status(201).json({
      success: true,
      note: populatedNote
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Activity Logs for a lead
// @route   GET /api/leads/:id/activity
// @access  Private
const getLeadActivity = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    if (req.user.role === 'MEMBER' && String(lead.assignedTo) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const activityLogs = await ActivityLog.find({ leadId: req.params.id })
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      activityLogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPublicLead,
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  addNote,
  getLeadActivity
};
