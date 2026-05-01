const mongoose = require('mongoose');

const GroupMemberSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  nickname: {
    type: String,
    default: ''
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'muted', 'banned'],
    default: 'active'
  },
  mutedUntil: {
    type: Date
  }
});

// 索引
GroupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
GroupMemberSchema.index({ groupId: 1, role: 1 });
GroupMemberSchema.index({ userId: 1 });

// 自动更新时间戳
GroupMemberSchema.pre('save', function(next) {
  this.lastActive = Date.now();
  next();
});

const GroupMember = mongoose.model('GroupMember', GroupMemberSchema);

module.exports = GroupMember;