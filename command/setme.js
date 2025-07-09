// setme.js
// 设置机器人状态的Discord斜杠命令

const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { setStatus } = require('../status');

// 有效的在线状态选项
const VALID_STATUS = ['online', 'idle', 'dnd', 'invisible'];

// 有效的活动类型选项
const VALID_ACTIVITY_TYPES = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

// 创建setme命令
const setmeCommand = {
  data: new SlashCommandBuilder()
    .setName('setme')
    .setDescription('设置机器人的状态和活动（仅管理员可用）')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('机器人的在线状态')
        .setRequired(false)
        .addChoices(
          { name: '在线 (Online)', value: 'online' },
          { name: '离开 (Idle)', value: 'idle' },
          { name: '请勿打扰 (Do Not Disturb)', value: 'dnd' },
          { name: '隐身 (Invisible)', value: 'invisible' }
        ))
    .addStringOption(option =>
      option.setName('activity_name')
        .setDescription('活动名称')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('activity_type')
        .setDescription('活动类型')
        .setRequired(false)
        .addChoices(
          { name: '正在玩 (Playing)', value: 'PLAYING' },
          { name: '正在直播 (Streaming)', value: 'STREAMING' },
          { name: '正在听 (Listening)', value: 'LISTENING' },
          { name: '正在看 (Watching)', value: 'WATCHING' },
          { name: '正在竞技 (Competing)', value: 'COMPETING' }
        ))
    .addStringOption(option =>
      option.setName('stream_url')
        .setDescription('直播URL（仅当活动类型为直播时需要）')
        .setRequired(false)),

  async execute(interaction) {
    // 检查用户是否有管理员权限
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      await interaction.reply({
        content: '❌ 只有管理员才能使用此命令来设置机器人状态。',
        ephemeral: true
      });
      return;
    }

    // 获取命令参数
    const status = interaction.options.getString('status');
    const activityName = interaction.options.getString('activity_name');
    const activityType = interaction.options.getString('activity_type');
    const streamUrl = interaction.options.getString('stream_url');

    // 如果没有提供任何参数，显示当前状态
    if (!status && !activityName && !activityType && !streamUrl) {
      const currentPresence = interaction.client.user.presence;
      const currentActivity = currentPresence.activities[0];
      
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('🤖 当前机器人状态')
        .addField('在线状态', getStatusDisplayName(currentPresence.status), true)
        .addField('活动名称', currentActivity ? currentActivity.name : '无', true)
        .addField('活动类型', currentActivity ? getActivityTypeDisplayName(currentActivity.type) : '无', true);

      if (currentActivity && currentActivity.url) {
        embed.addField('直播URL', currentActivity.url, false);
      }

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      return;
    }

    // 验证参数
    const validationError = validateParameters(status, activityType, streamUrl);
    if (validationError) {
      await interaction.reply({
        content: `❌ ${validationError}`,
        ephemeral: true
      });
      return;
    }

    // 构建状态选项对象
    const statusOptions = {};
    
    if (status) statusOptions.status = status;
    if (activityName) statusOptions.name = activityName;
    if (activityType) statusOptions.type = activityType;
    if (streamUrl && activityType === 'STREAMING') statusOptions.url = streamUrl;

    try {
      // 设置机器人状态
      setStatus(interaction.client, statusOptions);

      // 创建成功回复
      const embed = new MessageEmbed()
        .setColor('#00ff00')
        .setTitle('✅ 机器人状态已更新')
        .setDescription('状态设置成功！');

      if (status) embed.addField('在线状态', getStatusDisplayName(status), true);
      if (activityName) embed.addField('活动名称', activityName, true);
      if (activityType) embed.addField('活动类型', getActivityTypeDisplayName(activityType), true);
      if (streamUrl && activityType === 'STREAMING') embed.addField('直播URL', streamUrl, false);

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error setting bot status:', error);
      await interaction.reply({
        content: `❌ 设置机器人状态时出现错误: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * 验证命令参数
 * @param {string} status - 在线状态
 * @param {string} activityType - 活动类型
 * @param {string} streamUrl - 直播URL
 * @returns {string|null} 错误信息，如果验证通过则返回null
 */
function validateParameters(status, activityType, streamUrl) {
  // 验证在线状态
  if (status && !VALID_STATUS.includes(status)) {
    return `无效的在线状态: ${status}。有效选项: ${VALID_STATUS.join(', ')}`;
  }

  // 验证活动类型
  if (activityType && !VALID_ACTIVITY_TYPES.includes(activityType)) {
    return `无效的活动类型: ${activityType}。有效选项: ${VALID_ACTIVITY_TYPES.join(', ')}`;
  }

  // 验证直播URL
  if (streamUrl && activityType !== 'STREAMING') {
    return '直播URL只能在活动类型为"STREAMING"时使用。';
  }

  if (activityType === 'STREAMING' && streamUrl && !isValidUrl(streamUrl)) {
    return '请提供有效的直播URL。';
  }

  return null;
}

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} URL是否有效
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取在线状态的显示名称
 * @param {string} status - 状态值
 * @returns {string} 显示名称
 */
function getStatusDisplayName(status) {
  const statusMap = {
    'online': '🟢 在线',
    'idle': '🟡 离开',
    'dnd': '🔴 请勿打扰',
    'invisible': '⚫ 隐身'
  };
  return statusMap[status] || status;
}

/**
 * 获取活动类型的显示名称
 * @param {string} type - 活动类型
 * @returns {string} 显示名称
 */
function getActivityTypeDisplayName(type) {
  const typeMap = {
    'PLAYING': '🎮 正在玩',
    'STREAMING': '📺 正在直播',
    'LISTENING': '🎵 正在听',
    'WATCHING': '👀 正在看',
    'COMPETING': '🏆 正在竞技'
  };
  return typeMap[type] || type;
}

// 导出命令
module.exports = {
  setmeCommand
};