const fs = require("fs");
const path = require("path");
const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");

// 数据文件路径
const DATA_DIR = "./nbcs";
const SYSTEM_PROMPTS_FILE = path.join(DATA_DIR, "system_prompts.json");

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 存储用户对话历史的对象
const conversations = {};
// 存储分页历史记录的对象
const historyPagination = {};
// 默认的系统提示
const DEFAULT_SYSTEM_PROMPT = "你是一条狗";
// 最大对话历史长度（消息对数）
const MAX_HISTORY_LENGTH = 50;
// 每页显示的消息数量
const MESSAGES_PER_PAGE = 5;

// 加载系统提示
function loadSystemPrompts() {
  try {
    if (fs.existsSync(SYSTEM_PROMPTS_FILE)) {
      const data = fs.readFileSync(SYSTEM_PROMPTS_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading system prompts:", error);
  }
  return {};
}

// 初始化用户系统提示
const userSystemPrompts = loadSystemPrompts();

// 保存系统提示
function saveSystemPrompts() {
  try {
    fs.writeFileSync(
      SYSTEM_PROMPTS_FILE,
      JSON.stringify(userSystemPrompts, null, 2),
      "utf8",
    );
  } catch (error) {
    console.error("Error saving system prompts:", error);
  }
}

// 获取用户的系统提示
function getUserSystemPrompt(userId) {
  return userSystemPrompts[userId] || DEFAULT_SYSTEM_PROMPT;
}

// 设置用户的系统提示
function setUserSystemPrompt(userId, prompt) {
  userSystemPrompts[userId] = prompt;
  saveSystemPrompts();

  if (conversations[userId] && conversations[userId].length > 0) {
    if (conversations[userId][0].role === "system") {
      conversations[userId][0].content = prompt;
    } else {
      conversations[userId].unshift({ role: "system", content: prompt });
    }
  }
}

// 初始化或重置用户的对话
function initializeConversation(userId) {
  const systemPrompt = getUserSystemPrompt(userId);
  conversations[userId] = [{ role: "system", content: systemPrompt }];
}

// 创建对话历史嵌入式消息
function createHistoryEmbed(userId, page = 0) {
  const history = conversations[userId] || [];
  const userMessages = history.slice(1);
  const totalPages = Math.ceil(userMessages.length / MESSAGES_PER_PAGE);
  page = Math.max(0, Math.min(page, totalPages - 1));

  const startIndex = page * MESSAGES_PER_PAGE;
  const endIndex = Math.min(
    startIndex + MESSAGES_PER_PAGE,
    userMessages.length,
  );
  const pageMessages = userMessages.slice(startIndex, endIndex);

  const embed = new MessageEmbed()
    .setColor("#0099ff")
    .setTitle("对话历史")
    .setDescription(
      `显示第 ${startIndex + 1} 到 ${endIndex} 条消息，共 ${userMessages.length} 条`,
    )
    .setFooter({ text: `第 ${page + 1} 页，共 ${totalPages} 页` });

  for (let i = 0; i < pageMessages.length; i++) {
    const message = pageMessages[i];
    const role = message.role === "user" ? "你" : "AI";
    let content = message.content;
    if (typeof content === "string") {
      if (content.length > 1024) {
        content = content.substring(0, 1021) + "...";
      }
    } else if (Array.isArray(content)) {
      content = "包含图片的消息";
    }
    embed.addField(`${role}:`, content);
  }

  return { embed, currentPage: page, totalPages };
}

// 创建分页按钮
function createPaginationButtons(currentPage, totalPages) {
  const row = new MessageActionRow();

  row.addComponents(
    new MessageButton()
      .setCustomId("prev_page")
      .setLabel("上一页")
      .setStyle("PRIMARY")
      .setDisabled(currentPage <= 0),
  );

  row.addComponents(
    new MessageButton()
      .setCustomId("next_page")
      .setLabel("下一页")
      .setStyle("PRIMARY")
      .setDisabled(currentPage >= totalPages - 1),
  );

  return row;
}

// 清理过期的分页数据
setInterval(() => {
  const now = Date.now();
  for (const userId in historyPagination) {
    if (now - historyPagination[userId].timestamp > 30 * 60 * 1000) {
      delete historyPagination[userId];
    }
  }
}, 10 * 60 * 1000);

module.exports = {
  conversations,
  historyPagination,
  DEFAULT_SYSTEM_PROMPT,
  MAX_HISTORY_LENGTH,
  getUserSystemPrompt,
  setUserSystemPrompt,
  initializeConversation,
  createHistoryEmbed,
  createPaginationButtons,
};