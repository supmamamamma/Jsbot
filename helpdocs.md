# Discord AI Bot 使用帮助

本文档介绍如何在本地运行本项目，并在 Discord 服务器中使用 AI 机器人。

## 一、环境要求

- Node.js >= 16
- 一个已创建好的 Discord Bot（在 Discord 开发者平台）
- 一个有效的 OpenAI API Key

## 二、项目安装

1. 克隆仓库

```bash
git clone https://github.com/supmamamamma/Jsbot.git
cd Jsbot
```

2. 安装依赖

```bash
npm install
```

## 三、配置与启动

1. 第一次启动（自动生成 `.env`）

```bash
npm start
```

如果项目根目录下没有 `.env` 文件，程序会：
- 自动创建 `.env` 模板文件
- 在终端打印需要你填写的配置项说明

2. 编辑 `.env` 文件

`.env` 至少需要配置以下内容（示例）：

```env
DISCORD_TOKEN="YOUR_ACTUAL_DISCORD_BOT_TOKEN"
```

3. 再次启动机器人

```bash
npm start
```

看到终端提示机器人已登录，并且在 Discord 中显示在线，即代表启动成功。

## 四、在 Discord 中的使用

1. 确认机器人已被邀请到你的服务器，并且具有以下权限：
- 读取消息
- 发送消息
- 使用应用命令（Slash Commands）

2. 在任意频道输入 `/`，在指令列表中找到本机器人的命令。

### 常用命令总览

| 命令 | 主要用途 | 关键参数 | 说明 |
| ---- | -------- | -------- | ---- |
| `/configai` | 配置 AI 相关参数 | `apikey` 等 | 首次使用 AI 前，必须先设置 OpenAI API Key |
| `/ai` | 向 AI 发送消息 | `message`、可选图片 | 与 AI 聊天或提问，支持带图片的消息 |
| `/clear` | 清除当前用户对话历史 | 无 | 清空你与 AI 的会话上下文 |
| `/system` | 设置/查看系统提示词 | `prompt` | 可以让 AI 扮演特定角色或风格 |
| `/reset_system` | 重置系统提示词 | 无 | 恢复为默认系统提示 |
| `/listhis` | 查看对话历史 | `page`（可选） | 以分页形式查看历史对话 |
| `/getemoji` | 获取自定义表情信息 | `emoji` | 返回表情的 URL 和 ID |
| `/发送消息` | 发送嵌入式消息 | 文本相关参数 | 适合发送美观的公告或提示 |
| `/加密` | 加密文本 | `text` | 使用自定义编码规则加密文本 |
| `/解密` | 解密文本 | `text` | 解密由“加密”命令生成的文本 |

## 五、典型使用流程示例

1. 启动机器人：在服务器上运行
2. 在 Discord 中执行 `/configai apikey: YOUR_OPENAI_API_KEY`
3. 在任意文字频道输入 `/ai`，填入你的问题并发送
4. 如需清空上下文，对同一机器人执行 `/clear`

## 六、常见问题（FAQ）

**Q1：Slash 命令在服务器里看不到？**  
A：请确认：
- 已把机器人邀请到该服务器
- 机器人拥有 `applications.commands` 权限
- 等待 1–5 分钟，有时新命令在 Discord 侧需要一点同步时间

**Q2：机器人不回复消息？**  
A：请检查：
- 终端是否有报错信息
- `.env` 中的 `DISCORD_TOKEN` 是否正确
- `/configai` 中配置的 OpenAI API Key 是否有效

**Q3：如何修改 AI 的说话风格？**  
A：使用 `/system` 命令。例如：  
`让你扮演一位说话简洁的技术支持工程师，只用简体中文回答。`

## 七、更多信息

如需了解机器人内部实现或二次开发，请查看项目根目录下的 [`README.md`](README.md) 和源码文件。