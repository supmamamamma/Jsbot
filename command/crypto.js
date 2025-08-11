// --- 配置区 ---
const PREFIX = "贩狗司马了，视奸狗司马了：";
const CIPHER_CHARS = ['闹', '若', '逆', '天', '神', '人', '钩', '扒', '低', '能', '挠', '惨']; // 12个字符，代表0-11
const SEPARATOR = ' '; // 加密后字符间的分隔符

// --- 核心逻辑 ---

// 创建一个从字符到数字的映射，方便解密
const CHAR_TO_DIGIT_MAP = new Map(CIPHER_CHARS.map((char, index) => [char, index]));

// 10进制数字转为自定义的12进制字符串
function numberToBase12(n) {
    if (n === 0) return CIPHER_CHARS[0];
    let result = '';
    while (n > 0) {
        result = CIPHER_CHARS[n % 12] + result;
        n = Math.floor(n / 12);
    }
    return result;
}

// 自定义的12进制字符串转为10进制数字
function base12ToNumber(s) {
    let result = 0;
    for (const char of s) {
        if (!CHAR_TO_DIGIT_MAP.has(char)) {
            throw new Error(`无效的加密字符: "${char}"`);
        }
        result = result * 12 + CHAR_TO_DIGIT_MAP.get(char);
    }
    return result;
}

// 加密函数
function encryptText(plainText) {
    if (!plainText) return '';
    const encryptedChars = [];
    for (const char of plainText) {
        const charCode = char.charCodeAt(0);
        encryptedChars.push(numberToBase12(charCode));
    }
    return PREFIX + encryptedChars.join(SEPARATOR);
}

// 解密函数
function decryptText(cipherText) {
    if (!cipherText || !cipherText.startsWith(PREFIX)) {
        return "解密失败：文本缺少指定前缀或为空。";
    }
    const payload = cipherText.substring(PREFIX.length);
    const parts = payload.split(SEPARATOR);
    let decryptedText = '';
    try {
        for (const part of parts) {
            if (part === '') continue;
            const charCode = base12ToNumber(part);
            decryptedText += String.fromCharCode(charCode);
        }
    } catch (e) {
        return `解密失败：${e.message}`;
    }
    return decryptedText;
}

// --- Discord 指令集成 ---

const cryptoCommands = [
    {
        name: '加密',
        description: '使用自定义编码加密文本。',
        options: [
            {
                name: '文本',
                description: '需要加密的文本内容',
                type: 3, // STRING
                required: true
            }
        ]
    },
    {
        name: '解密',
        description: '解密使用自定义编码的文本。',
        options: [
            {
                name: '文本',
                description: '需要解密的文本内容',
                type: 3, // STRING
                required: true
            }
        ]
    }
];

async function handleCrypto(interaction) {
    const commandName = interaction.commandName;
    const text = interaction.options.getString('文本');
    let result;

    if (commandName === '加密') {
        result = encryptText(text);
    } else if (commandName === '解密') {
        result = decryptText(text);
    }

    await interaction.reply({ content: result, ephemeral: true });
}

module.exports = {
    cryptoCommands,
    handleCrypto
};
