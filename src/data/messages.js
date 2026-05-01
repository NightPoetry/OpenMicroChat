const now = Date.now();
const today = new Date();
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

const defaultMessages = {
  '1': [
    { id: 'm1', content: '嘿，最近怎么样？', sender: '1', type: 'text', timestamp: todayMs + 10 * 3600000 + 30 * 60000 },
    { id: 'm2', content: '还不错，一直在忙项目。你呢？', sender: 'user', type: 'text', timestamp: todayMs + 10 * 3600000 + 31 * 60000 },
    { id: 'm3', content: '我也是，项目 deadline 快到了，一直在加班。', sender: '1', type: 'text', timestamp: todayMs + 10 * 3600000 + 32 * 60000 },
    { id: 'm4', content: '加油！我们一定能按时完成的。', sender: 'user', type: 'text', timestamp: todayMs + 10 * 3600000 + 33 * 60000 },
    { id: 'm5', content: '谢谢，借你吉言！', sender: '1', type: 'text', timestamp: todayMs + 10 * 3600000 + 34 * 60000 },
  ],
  '2': [
    { id: 'm6', content: '明天一起吃饭吧，我请客！', sender: '2', type: 'text', timestamp: todayMs - 24 * 3600000 + 18 * 3600000 },
    { id: 'm7', content: '好啊，几点？在哪里？', sender: 'user', type: 'text', timestamp: todayMs - 24 * 3600000 + 18 * 3600000 + 5 * 60000 },
    { id: 'm8', content: '明天中午12点，就在公司楼下的餐厅吧。', sender: '2', type: 'text', timestamp: todayMs - 24 * 3600000 + 18 * 3600000 + 10 * 60000 },
    { id: 'm9', content: '没问题，明天见！', sender: 'user', type: 'text', timestamp: todayMs - 24 * 3600000 + 18 * 3600000 + 15 * 60000 },
  ],
  '4': [
    { id: 'm10', content: '大家好，我是新来的前端开发，很高兴加入团队！', sender: '6', type: 'text', timestamp: todayMs + 9 * 3600000 },
    { id: 'm11', content: '欢迎欢迎！', sender: '2', type: 'text', timestamp: todayMs + 9 * 3600000 + 5 * 60000 },
    { id: 'm12', content: '欢迎加入！有什么需要帮助的随时说。', sender: 'user', type: 'text', timestamp: todayMs + 9 * 3600000 + 10 * 60000 },
    { id: 'm13', content: '代码已经提交了，请大家 review 一下。', sender: '2', type: 'text', timestamp: todayMs + 9 * 3600000 + 45 * 60000 },
    { id: 'm14', content: '收到，我现在就看。', sender: '3', type: 'text', timestamp: todayMs + 9 * 3600000 + 46 * 60000 },
  ]
};

export default defaultMessages;
