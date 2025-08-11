// status.js
// 自定义Discord机器人在线状态模块

/**
 * 设置机器人基本状态
 * @param {Object} client - Discord客户端实例
 * @param {Object} options - 状态选项
 * @param {string} options.status - 在线状态，可选值: 'online', 'idle', 'dnd', 'invisible'
 * @param {string} options.name - 活动名称
 * @param {string} options.type - 活动类型，可选值: 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'
 * @param {string} options.url - 直播URL (仅当type为STREAMING时需要)
 */
function setStatus(client, options = {}) {
  const { status = 'online', name = '服务中', type = 'PLAYING', url = null } = options;
  
  const presenceData = {
    status: status,
    activities: [{
      name: name,
      type: type
    }]
  };
  
  // 如果是直播状态，添加URL
  if (type === 'STREAMING' && url) {
    presenceData.activities[0].url = url;
  }
  
  client.user.setPresence(presenceData);
  console.log(`[Status] 状态已设置为: ${status}, ${type} ${name}`);
}

/**
 * 设置随机状态
 * @param {Object} client - Discord客户端实例
 * @param {Array} statusOptions - 状态选项数组
 */
function setRandomStatus(client, statusOptions) {
  if (!statusOptions || !statusOptions.length) {
    statusOptions = defaultStatusOptions;
  }
  
  const option = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  setStatus(client, option);
}

/**
 * 开始状态轮换
 * @param {Object} client - Discord客户端实例
 * @param {Array} statusOptions - 状态选项数组
 * @param {number} interval - 切换间隔(毫秒)
 * @returns {number} 定时器ID
 */
function startStatusRotation(client, statusOptions, interval = 60000) {
  if (!statusOptions || !statusOptions.length) {
    statusOptions = defaultStatusOptions;
  }
  
  // 立即设置第一个状态
  let currentIndex = 0;
  setStatus(client, statusOptions[currentIndex]);
  
  // 设置定时器定期轮换状态
  const timerId = setInterval(() => {
    currentIndex = (currentIndex + 1) % statusOptions.length;
    setStatus(client, statusOptions[currentIndex]);
  }, interval);
  
  console.log(`[Status] 状态轮换已启动，间隔: ${interval}ms`);
  
  // 返回定时器ID，以便于需要时可以停止
  return timerId;
}

/**
 * 停止状态轮换
 * @param {number} timerId - 由startStatusRotation返回的定时器ID
 */
function stopStatusRotation(timerId) {
  if (timerId) {
    clearInterval(timerId);
    console.log(`[Status] 状态轮换已停止`);
  }
}

// 默认状态选项
const defaultStatusOptions = [
  { name: 'AI 助手服务中', type: 'PLAYING', status: 'online' },
  { name: '使用 /ai 与我交流', type: 'WATCHING', status: 'online' },
  { name: '用户的问题', type: 'LISTENING', status: 'online' },
  { name: '处理请求中', type: 'PLAYING', status: 'idle' }
];

// 导出方法
module.exports = {
  setStatus,
  setRandomStatus,
  startStatusRotation,
  stopStatusRotation,
  defaultStatusOptions
};
