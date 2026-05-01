const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  memberCount: {
    type: Number,
    default: 0
  },
  maxMembers: {
    type: Number,
    default: 500
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  joinCode: {
    type: String,
    unique: true
  },
  settings: {
    messageHistory: {
      type: Boolean,
      default: true
    },
    allowMembersToInvite: {
      type: Boolean,
      default: true
    },
    allowMembersToSendMedia: {
      type: Boolean,
      default: true
    }
  }
});

// 自动更新时间戳
GroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Group = mongoose.model('Group', GroupSchema);

module.exports = Group;