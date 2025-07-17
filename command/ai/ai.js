const { SlashCommandBuilder } = require("@discordjs/builders");
const { getUserAIConfig } = require("../configai");
const {
  conversations,
  MAX_HISTORY_LENGTH,
  initializeConversation,
} = require("./aiStateManager");
const { OpenAI } = require("openai");

// 获取用户特定的OpenAI客户端
function getUserOpenAI(userId) {
  const config = getUserAIConfig(userId);

  // 如果没有API Key，则抛出错误
  if (!config.apiKey) {
    throw new Error("用户未配置API Key。请使用 /configai 命令进行配置。");
  }

  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL || "https://openrouter.ai/api/v1",
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("向ai发送消息")
    .addStringOption((option) =>
      option.setName("message").setDescription("信息").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("pic").setDescription("图片url").setRequired(false),
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    // 检查用户是否配置了API Key
    const userConfig = getUserAIConfig(userId);
    if (!userConfig.apiKey) {
      await interaction.reply({
        content:
          "您还没有配置您的 OpenAI API 密钥。请使用 `/configai` 命令进行设置。",
        ephemeral: true,
      });
      return;
    }

    // 获取用户输入的消息
    const userMessage = interaction.options.getString("message");
    // 获取用户提供的图片URL（如果有）
    const imageUrl = interaction.options.getString("pic");

    // 先回复一个临时消息，因为 API 调用可能需要一些时间
    await interaction.deferReply();

    try {
      // 初始化用户的对话历史（如果不存在）
      if (!conversations[userId]) {
        initializeConversation(userId);
      }

      // 准备消息内容
      let userContent;

      // 如果提供了图片URL，添加图片到消息中
      if (imageUrl) {
        userContent = [
          { type: "text", text: userMessage },
          { type: "image_url", image_url: { url: imageUrl } },
        ];

        // 添加用户消息（包含图片）到对话历史
        conversations[userId].push({
          role: "user",
          content: userContent,
        });
      } else {
        // 否则只添加文本消息
        conversations[userId].push({ role: "user", content: userMessage });
      }
      // 创建API消息数组的副本
      const apiMessages = [...conversations[userId]];

      console.log("Sending to OpenAI:", JSON.stringify(apiMessages, null, 2));

      // 获取用户特定的OpenAI客户端
      const userOpenAI = getUserOpenAI(userId);

      // 调用 OpenAI API
      if (userConfig.stream) {
        const stream = await userOpenAI.chat.completions.create({
          model: userConfig.model || "google/gemini-2.0-flash-001",
          messages: apiMessages,
          max_tokens: userConfig.max_tokens || 2048,
          temperature: userConfig.temperature || 1.0,
          top_p: userConfig.top_p || 0.9,
          stream: true,
        });

        let fullResponse = "";
        let lastUpdateTime = 0;
        const updateInterval = 1000; // 1秒

        for await (const chunk of stream) {
          fullResponse += chunk.choices[0]?.delta?.content || "";
          const now = Date.now();
          if (now - lastUpdateTime > updateInterval) {
            if (fullResponse.length > 0) {
              await interaction.editReply(fullResponse.slice(0, 2000));
              lastUpdateTime = now;
            }
          }
        }

        if (fullResponse.length > 0) {
          await interaction.editReply(fullResponse.slice(0, 2000));
        }

        conversations[userId].push({
          role: "assistant",
          content: fullResponse,
        });
      } else {
        const response = await userOpenAI.chat.completions.create({
          model: userConfig.model || "google/gemini-2.0-flash-001", // 使用用户配置的模型
          messages: apiMessages,
          max_tokens: userConfig.max_tokens || 2048,
          temperature: userConfig.temperature || 1.0,
          top_p: userConfig.top_p || 0.9,
        });
        const aiResponse = response.choices[0].message.content;
        conversations[userId].push({
          role: "assistant",
          content: aiResponse,
        });

        let replyContent = `${aiResponse}`;
        if (replyContent.length > 2000) {
          replyContent = replyContent.substring(0, 1997) + "...";
        }
        await interaction.editReply({ content: replyContent });
      }

      // 如果对话历史太长，删除最早的消息（保留 system 消息）
      if (conversations[userId].length > MAX_HISTORY_LENGTH + 1) {
        conversations[userId] = [
          conversations[userId][0],
          ...conversations[userId].slice(-MAX_HISTORY_LENGTH),
        ];
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      await interaction.editReply({
        content: `抱歉，调用 AI 时出现了错误: ${error.message}`,
      });
    }
  },
};