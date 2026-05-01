const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'file'],
    default: 'text'
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  }
});

// 索引
MessageSchema.index({ sender: 1, receiver: 1, timestamp: 1 });
MessageSchema.index({ group: 1, timestamp: 1 });

const Message = mongoose.model('Message', MessageSchema);

module.exports = Message;