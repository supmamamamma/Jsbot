const { MessageEmbed } = require('discord.js');

// 发送消息命令的定义
const sendMessageCommand = {
    name: '发送消息',
    description: '发送一个自定义的嵌入式消息',
    options: [
        {
            name: '标题',
            description: '嵌入消息的标题',
            type: 3, // STRING
            required: true
        },
        {
            name: '内容',
            description: '嵌入消息的主要内容',
            type: 3, // STRING
            required: true
        },
        {
            name: '颜色',
            description: '嵌入消息的颜色（十六进制，如：#FF0000）',
            type: 3, // STRING
            required: false
        },
        {
            name: '图片',
            description: '嵌入消息的图片URL',
            type: 3, // STRING
            required: false
        },
        {
            name: '缩略图',
            description: '嵌入消息的缩略图URL',
            type: 3, // STRING
            required: false
        },
        {
            name: '页脚',
            description: '嵌入消息的页脚文本',
            type: 3, // STRING
            required: false
        }
    ]
};

// 处理发送消息命令的函数
async function handleSendMessage(interaction) {
    // 获取用户输入的参数
    const title = interaction.options.getString('标题');
    const description = interaction.options.getString('内容');
    const color = interaction.options.getString('颜色') || '#0099ff';
    const image = interaction.options.getString('图片');
    const thumbnail = interaction.options.getString('缩略图');
    const customFooter = interaction.options.getString('页脚');

    // 获取发送人信息
    const user = interaction.user;
    const member = interaction.member;
    const displayName = member ? member.displayName : user.username;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 64 });

    try {
        // 先回复一个不可见的提示信息
        await interaction.reply({ 
            content: '✅ 嵌入消息已发送！', 
            ephemeral: true 
        });

        // 创建嵌入式消息
        const embed = new MessageEmbed()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp();

        // 添加可选字段
        if (image) {
            embed.setImage(image);
        }
        
        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }
        
        // 设置页脚，包含发送人信息
        let footerText = `发送者: ${displayName}`;
        if (customFooter) {
            footerText = `${customFooter} • 发送者: ${displayName}`;
        }
        
        embed.setFooter({ 
            text: footerText,
            iconURL: avatarURL
        });

        // 直接向频道发送嵌入式消息，避免回复样式
        await interaction.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('发送消息时出错：', error);
        
        // 如果还没有回复过，则发送错误消息
        if (!interaction.replied) {
            await interaction.reply({ 
                content: '❌ 发送消息时出现错误，请稍后再试。', 
                ephemeral: true 
            });
        } else {
            // 如果已经回复过，则使用 followUp
            await interaction.followUp({ 
                content: '❌ 发送消息时出现错误，请稍后再试。', 
                ephemeral: true 
            });
        }
    }
}

module.exports = {
    sendMessageCommand,
    handleSendMessage
};
