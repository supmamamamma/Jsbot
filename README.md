# Discord AI Bot

这是一个使用 OpenAI API 和 `discord.js` 构建的 Discord 机器人。它能够像聊天机器人一样与用户进行对话，并支持自定义系统提示和对话历史记录。

## 功能

*   **/ai**: 向 AI 发送消息，并可选择附带图片。
*   **/clear**: 清除与 AI 的对话历史。
*   **/system**: 设置或查看自定义的 AI 系统提示。
*   **/reset_system**: 将系统提示重置为默认值。
*   **/listhis**: 查看与 AI 的对话历史记录。
*   **/getemoji**: 获取自定义表情的 URL 和 ID。
*   **/configai**: 配置个性化的 AI 参数，如模型、温度等。
*   **/发送消息**: 发送一个自定义的嵌入式消息。
*   **/加密**: 使用自定义编码加密文本。
*   **/解密**: 解密使用自定义编码的文本。
*   **安全**: 将敏感凭据（如机器人令牌和 API 密钥）安全地存储在 `.env` 文件中。

## 设置

1.  **克隆仓库**
    ```bash
    git clone https://github.com/supmamamamma/Jsbot.git
    cd Jsbot
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **自動配置 (新功能!)**
    首次運行機器人時，系統會自動檢查並創建 `.env` 配置文件：
    
    ```bash
    npm start
    ```
    
    如果沒有 `.env` 文件，系統會：
    - 自動創建 `.env` 文件模板
    - 顯示詳細的配置指南
    - 提示您完成必要的配置步驟

4.  **配置 Discord Token**
    打開自動創建的 `.env` 文件，將 `YOUR_DISCORD_BOT_TOKEN_HERE` 替換為您的實際 Discord Bot Token：

    ```env
    DISCORD_TOKEN="YOUR_ACTUAL_DISCORD_BOT_TOKEN"
    ```

5.  **配置 AI**
    启动机器人后，您必须在 Discord 中使用 `/configai` 命令来配置您的 OpenAI API 密钥，然后才能使用 AI 功能。
    
    `/configai apikey: YOUR_OPENAI_API_KEY`

## 运行机器人

使用以下命令启动机器人：

```bash
npm start
```

机器人启动并登录到 Discord 后，您就可以在您的服务器中与它互动了。