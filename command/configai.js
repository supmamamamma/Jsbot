// configai.js
const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

// 配置文件路径
const DATA_DIR = './nbcs';
const AI_CONFIG_FILE = path.join(DATA_DIR, 'ai_config.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 默认配置
const DEFAULT_CONFIG = {
  baseURL: 'https://openrouter.ai/api/v1',
  model: 'google/gemini-2.0-flash-001',
  temperature: 1.0,
  top_p: 0.9,
  max_tokens: 2048,
  apiKey: null,
  stream: false
};

// 加载AI配置
function loadAIConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const data = fs.readFileSync(AI_CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading AI config:', error);
  }
  return {};
}

// 保存AI配置
function saveAIConfig(config) {
  try {
    fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving AI config:', error);
  }
}

// 获取用户的AI配置
function getUserAIConfig(userId) {
  const configs = loadAIConfig();
  return configs[userId] || { ...DEFAULT_CONFIG };
}

// 设置用户的AI配置
function setUserAIConfig(userId, newConfig) {
  const configs = loadAIConfig();
  
  // 获取当前配置或使用默认值
  const currentConfig = configs[userId] || { ...DEFAULT_CONFIG };
  
  // 更新配置（只更新提供的字段）
  configs[userId] = {
    ...currentConfig,
    ...newConfig
  };
  
  // 保存到文件
  saveAIConfig(configs);
  
  return configs[userId];
}

// 创建命令
const configAICommand = {
  data: new SlashCommandBuilder()
    .setName('configai')
    .setDescription('Configure AI settings')
    .addStringOption(option => 
      option.setName('baseurl')
        .setDescription('API base URL')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('apikey')
        .setDescription('您的 OpenAI API 密钥')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('model')
        .setDescription('AI model to use')
        .setRequired(false))
    .addNumberOption(option => 
      option.setName('temperature')
        .setDescription('Temperature (0.0-2.0)')
        .setMinValue(0)
        .setMaxValue(2)
        .setRequired(false))
    .addNumberOption(option => 
      option.setName('top_p')
        .setDescription('Top P (0.0-1.0)')
        .setMinValue(0)
        .setMaxValue(1)
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('max_tokens')
        .setDescription('Maximum tokens in response')
        .setMinValue(1)
        .setMaxValue(8192)
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('stream')
        .setDescription('Enable or disable streaming response')
        .setRequired(false))
    .addBooleanOption(option =>
      option.setName('reset')
        .setDescription('Reset to default settings')
        .setRequired(false)),
  
  async execute(interaction) {
    const userId = interaction.user.id;
    
    // 检查是否要重置设置
    const resetSettings = interaction.options.getBoolean('reset');
    
    if (resetSettings) {
      setUserAIConfig(userId, { ...DEFAULT_CONFIG });
      await interaction.reply({
        content: '已将 AI 设置重置为默认值。',
        ephemeral: true
      });
      return;
    }
    
    // 获取当前配置
    const currentConfig = getUserAIConfig(userId);
    
    // 获取新的配置选项
    const newConfig = {};
    
    const baseURL = interaction.options.getString('baseurl');
    if (baseURL) newConfig.baseURL = baseURL;
    
    const apiKey = interaction.options.getString('apikey');
    if (apiKey) newConfig.apiKey = apiKey;
    
    const model = interaction.options.getString('model');
    if (model) newConfig.model = model;
    
    const temperature = interaction.options.getNumber('temperature');
    if (temperature !== null) newConfig.temperature = temperature;
    
    const top_p = interaction.options.getNumber('top_p');
    if (top_p !== null) newConfig.top_p = top_p;
    
    const max_tokens = interaction.options.getInteger('max_tokens');
    if (max_tokens !== null) newConfig.max_tokens = max_tokens;

    const stream = interaction.options.getBoolean('stream');
    if (stream !== null) newConfig.stream = stream;
    
    // 如果没有提供任何参数，显示当前配置
    if (Object.keys(newConfig).length === 0) {
      const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle('当前 AI 配置')
        .addField('Base URL', currentConfig.baseURL || 'Not set')
        .addField('API Key', currentConfig.apiKey ? '******' : '未设置 (请使用 /configai apikey: YOUR_KEY 进行设置)')
        .addField('Model', currentConfig.model || 'Not set')
        .addField('Temperature', String(currentConfig.temperature || 'Not set'))
        .addField('Top P', String(currentConfig.top_p || 'Not set'))
        .addField('Max Tokens', String(currentConfig.max_tokens || 'Not set'))
        .addField('Stream', String(currentConfig.stream || 'Not set'));
      
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
      return;
    }
    
    // 更新配置
    const updatedConfig = setUserAIConfig(userId, newConfig);
    
    // 创建回复消息
    let replyContent = '已更新 AI 配置：\n';
    
    if (newConfig.baseURL) replyContent += `- Base URL: ${newConfig.baseURL}\n`;
    if (newConfig.apiKey) replyContent += `- API Key: ******\n`;
    if (newConfig.model) replyContent += `- Model: ${newConfig.model}\n`;
    if (newConfig.temperature !== undefined) replyContent += `- Temperature: ${newConfig.temperature}\n`;
    if (newConfig.top_p !== undefined) replyContent += `- Top P: ${newConfig.top_p}\n`;
    if (newConfig.max_tokens !== undefined) replyContent += `- Max Tokens: ${newConfig.max_tokens}\n`;
    if (newConfig.stream !== undefined) replyContent += `- Stream: ${newConfig.stream}\n`;
    
    await interaction.reply({
      content: replyContent,
      ephemeral: true
    });
  }
};

// 导出模块
module.exports = {
  configAICommand,
  getUserAIConfig
};
