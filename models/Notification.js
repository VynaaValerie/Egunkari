const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['like', 'comment', 'reply', 'follow', 'share']
  },
  message: { type: String, required: true },
  noteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Note' 
  },
  commentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  relatedUserId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);