const now = Date.now();

function makeAvatar(name, color) {
  const svg = `<svg width="50" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" fill="${color}" rx="25"/><text x="25" y="33" font-size="20" text-anchor="middle" fill="white" font-weight="bold">${name.charAt(0)}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const defaultContacts = [
  {
    id: '1',
    name: '张三',
    avatar: makeAvatar('张', '#FF6B6B'),
    isOnline: true,
    lastMessage: '加油！我们一定能按时完成的。',
    lastMessageTime: now - 30 * 60 * 1000,
    unreadCount: 0,
    type: 'personal',
    tags: ['t1', 't2']
  },
  {
    id: '2',
    name: '李四',
    avatar: makeAvatar('李', '#4ECDC4'),
    isOnline: true,
    lastMessage: '没问题，明天见！',
    lastMessageTime: now - 24 * 60 * 60 * 1000,
    unreadCount: 0,
    type: 'personal',
    tags: ['t1']
  },
  {
    id: '3',
    name: '王五',
    avatar: makeAvatar('王', '#45B7D1'),
    isOnline: false,
    lastMessage: '项目进度如何？',
    lastMessageTime: now - 3 * 24 * 60 * 60 * 1000,
    unreadCount: 0,
    type: 'personal',
    tags: ['t1', 't4']
  },
  {
    id: '4',
    name: '前端开发小组',
    avatar: makeAvatar('前', '#5856d6'),
    isOnline: true,
    lastMessage: '[李四] 代码已经提交了',
    lastMessageTime: now - 45 * 60 * 1000,
    unreadCount: 5,
    type: 'group',
    memberCount: 5,
    tags: ['t4']
  },
  {
    id: '5',
    name: '家庭群',
    avatar: makeAvatar('家', '#ff9500'),
    isOnline: false,
    lastMessage: '[妈妈] 周末回家吃饭',
    lastMessageTime: now - 2 * 24 * 60 * 60 * 1000,
    unreadCount: 0,
    type: 'group',
    memberCount: 8,
    tags: ['t3']
  }
];

export default defaultContacts;
