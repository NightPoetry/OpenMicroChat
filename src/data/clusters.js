// 聚类数据

export const defaultClusters = [
  {
    id: '1',
    name: '同事',
    count: 3,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20cluster%20icon%20professional&image_size=square',
    color: '#007aff',
    createdAt: new Date().getTime() - 7 * 24 * 60 * 60 * 1000 // 7天前创建
  },
  {
    id: '2',
    name: '朋友',
    count: 2,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=friends%20cluster%20icon%20friendly&image_size=square',
    color: '#34c759',
    createdAt: new Date().getTime() - 5 * 24 * 60 * 60 * 1000 // 5天前创建
  },
  {
    id: '3',
    name: '家庭',
    count: 1,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=family%20cluster%20icon%20warm&image_size=square',
    color: '#ff9500',
    createdAt: new Date().getTime() - 3 * 24 * 60 * 60 * 1000 // 3天前创建
  },
  {
    id: '4',
    name: '工作',
    count: 1,
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=work%20cluster%20icon%20productive&image_size=square',
    color: '#5856d6',
    createdAt: new Date().getTime() - 1 * 24 * 60 * 60 * 1000 // 1天前创建
  }
];

export default defaultClusters;