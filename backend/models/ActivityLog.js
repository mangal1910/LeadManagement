const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    actionType: {
      type: String,
      enum: ['STATUS_CHANGE', 'ASSIGNMENT', 'NOTE_ADDED', 'LEAD_CREATED', 'LEAD_UPDATED'],
      required: true
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
