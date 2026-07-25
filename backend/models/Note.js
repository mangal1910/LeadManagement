const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Note content cannot be empty'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ leadId: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
