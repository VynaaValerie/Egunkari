const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  noteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Note', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  parentCommentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  attachment: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);