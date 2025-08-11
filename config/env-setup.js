// env-setup.js - 環境配置自動設置模組
const fs = require('fs');
const path = require('path');

// .env 文件路徑
const ENV_FILE_PATH = path.join(process.cwd(), '.env');

// .env 文件模板內容
const ENV_TEMPLATE = `# Discord Bot 配置文件
# 請填入您的 Discord Bot Token
DISCORD_TOKEN="YOUR_DISCORD_BOT_TOKEN_HERE"

# 可選：如果您想設置默認的 OpenAI API Key（用戶仍可通過 /configai 命令個別設置）
# OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# 可選：默認 API Base URL
# API_BASE_URL="https://openrouter.ai/api/v1"

# 配置說明：
# 1. 將 YOUR_DISCORD_BOT_TOKEN_HERE 替換為您的實際 Discord Bot Token
# 2. 如需使用 AI 功能，請在 Discord 中使用 /configai 命令設置您的 API Key
# 3. 保存此文件後重新啟動機器人
`;

/**
 * 檢查並創建 .env 文件
 * @returns {Object} 包含檢查結果的對象
 */
function checkAndCreateEnvFile() {
  const result = {
    exists: false,
    created: false,
    error: null,
    message: ''
  };

  try {
    // 檢查 .env 文件是否存在
    if (fs.existsSync(ENV_FILE_PATH)) {
      result.exists = true;
      result.message = '.env 文件已存在';
      return result;
    }

    // 創建 .env 文件
    fs.writeFileSync(ENV_FILE_PATH, ENV_TEMPLATE, 'utf8');
    result.created = true;
    result.message = '.env 文件已自動創建';
    
    return result;
  } catch (error) {
    result.error = error;
    result.message = `創建 .env 文件時發生錯誤: ${error.message}`;
    return result;
  }
}

/**
 * 驗證環境變量配置
 * @returns {Object} 驗證結果
 */
function validateEnvironment() {
  const validation = {
    hasDiscordToken: false,
    discordTokenValid: false,
    warnings: [],
    errors: []
  };

  // 先載入 dotenv 以確保能讀取環境變量
  require('dotenv').config();

  // 檢查 Discord Token
  const discordToken = process.env.DISCORD_TOKEN;
  if (discordToken) {
    validation.hasDiscordToken = true;
    // 簡單驗證 Discord Token 格式（不是 placeholder）
    if (discordToken !== 'YOUR_DISCORD_BOT_TOKEN_HERE' && discordToken.length > 50) {
      validation.discordTokenValid = true;
    } else {
      validation.errors.push('Discord Token 似乎未正確配置，請檢查 .env 文件');
    }
  } else {
    validation.errors.push('未找到 DISCORD_TOKEN 環境變量');
  }

  return validation;
}

/**
 * 顯示配置指導信息
 */
function showConfigurationGuide() {
  console.log('\n' + '='.repeat(60));
  console.log('🤖 Discord Bot 配置指南');
  console.log('='.repeat(60));
  console.log('');
  console.log('📁 已自動創建 .env 配置文件');
  console.log('');
  console.log('⚠️  請按照以下步驟完成配置：');
  console.log('');
  console.log('1. 打開項目根目錄下的 .env 文件');
  console.log('2. 將 YOUR_DISCORD_BOT_TOKEN_HERE 替換為您的實際 Discord Bot Token');
  console.log('3. 保存文件後重新啟動機器人');
  console.log('');
  console.log('💡 提示：');
  console.log('   • Discord Bot Token 可在 Discord Developer Portal 獲取');
  console.log('   • AI 功能需要在 Discord 中使用 /configai 命令單獨配置');
  console.log('   • 請勿將 .env 文件提交到版本控制系統');
  console.log('');
  console.log('='.repeat(60));
  console.log('');
}

/**
 * 初始化環境配置
 * @returns {Object} 初始化結果
 */
function initializeEnvironment() {
  console.log('🔍 檢查環境配置...');
  
  const envResult = checkAndCreateEnvFile();
  
  if (envResult.error) {
    console.error('❌ 環境配置初始化失敗:', envResult.message);
    return { success: false, error: envResult.error };
  }
  
  if (envResult.created) {
    console.log('✅ ' + envResult.message);
    showConfigurationGuide();
    return { success: true, created: true, needsConfiguration: true };
  }
  
  if (envResult.exists) {
    console.log('✅ ' + envResult.message);
    
    // 驗證現有配置
    const validation = validateEnvironment();
    
    if (validation.errors.length > 0) {
      console.log('⚠️  配置驗證發現問題:');
      validation.errors.forEach(error => console.log('   • ' + error));
      console.log('');
      console.log('💡 請檢查並更新 .env 文件中的配置');
      return { success: true, needsConfiguration: true, validation };
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  配置警告:');
      validation.warnings.forEach(warning => console.log('   • ' + warning));
    }
    
    return { success: true, validation };
  }
  
  return { success: false, error: new Error('未知錯誤') };
}

module.exports = {
  initializeEnvironment,
  checkAndCreateEnvFile,
  validateEnvironment,
  showConfigurationGuide
};