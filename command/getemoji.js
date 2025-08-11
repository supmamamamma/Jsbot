// emojiModule.js

const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

// 主要处理函数
async function touemoji(interaction) {
  const emojiInput = interaction.options.getString('emoji');
  
  // 解析表情输入
  const emojiRegex = /<(a)?:([a-zA-Z0-9_]+):(\d+)>/;
  const match = emojiInput.match(emojiRegex);
  
  if (!match) {
    return interaction.reply({ 
      content: '无效的表情格式。请输入一个有效的自定义表情，例如 <:name:id>', 
      ephemeral: true 
    });
  }
  
  const emojiName = match[2];
  const emojiId = match[3];
  const emojiURL = `https://cdn.discordapp.com/emojis/${emojiId}`;
  
  // 创建嵌入消息
  const embed = new MessageEmbed()
    .setColor('#76BB40')
    .setTitle(`来！来偷: ${emojiName}`)
    .addField('表情 ID', emojiId, true)
    .addField('表情名称', emojiName, true)
    .addField('表情 URL:', `[点击开偷](${emojiURL})`)
    .setImage(emojiURL)
    .setTimestamp();
  
  // 创建按钮
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setLabel('开偷！')
        .setStyle('LINK')
        .setURL(emojiURL)
    );
  
  // 回复交互
  await interaction.reply({ 
    embeds: [embed],
    components: [row]
  });
}

// 命令定义 - 使用 fangsuqi 标识符
const fangsuqi = {
  name: 'getemoji',
  description: '获取其他服务器自定义表情的详细信息',
  options: [
    {
      name: 'emoji',
      type: 3, // STRING
      description: '输入一个自定义表情（例如 <:name:id>）',
      required: true
    }
  ]
};

module.exports = {
  touemoji,
  fangsuqi
};
