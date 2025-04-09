const mongoose = require('mongoose');

const viewSchema = new mongoose.Schema({
  noteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Note', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  createdAt: { type: Date, default: Date.now }
});

viewSchema.index({ noteId: 1, userId: 1 });

module.exports = mongoose.model('View', viewSchema);