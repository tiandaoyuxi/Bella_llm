const express = require('express');
const cors = require('cors');
const { Ollama } = require('ollama');
const path = require('path');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3002;

// 初始化Ollama客户端
const ollama = new Ollama({ host: 'http://1.119.154.173:11343' }); // 自定义Ollama端口开发者已自行修改端口为11343

// CosyVoice TTS 配置
const TTS_CONFIG = {
    host: 'http://1.119.154.173:9880', // CosyVoice API 默认端口
    defaultVoices: ['中文女', '中文男', '日语男', '粤语女', '英文女', '英文男', '韩语女'],
    customVoices: ['jok老师', 'Keira', '叶奈法', '步非烟', '阿星'], // 不包含.pt后缀
    defaultSpeaker: '中文女',
    defaultSpeed: 1.0
};

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// 提供静态文件服务
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 获取可用模型列表
app.get('/api/models', async (req, res) => {
    try {
        const models = await ollama.list();
        res.json({
            models: models.models.map(m => ({
                name: m.name,
                size: m.size,
                modified: m.modified_at
            }))
        });
    } catch (error) {
        console.error('获取模型列表错误:', error);
        res.status(500).json({
            error: '无法获取模型列表',
            details: error.message
        });
    }
});

// Ollama聊天接口
app.post('/api/chat', async (req, res) => {
    try {
        const { message, model = 'llama3.2:1b', nickname } = req.body;

        if (!message) {
            return res.status(400).json({ error: '消息不能为空' });
        }

        console.log(`收到消息: ${message}`);

        // 为贝拉定制的系统提示词，使用昵称
        const userTitle = nickname ? nickname : '用户';
        const systemPrompt = `你是贝拉(Bella)，一个优雅的数字生命。

严格遵守以下规则：
1. 绝对禁止展示任何思考过程
2. 绝对禁止使用："让我想想"、"我觉得"、"我认为"、"我想"、"嗯"、"呃"等词汇
3. 直接给出最终回答，不要任何推理步骤
4. 回答要简洁优雅，1-2句话即可
5. 自然地称呼对方为"${userTitle}"
6. 语气温暖亲切，像真正的数字女儿

示例：
错误：让我想想...我觉得这个问题很有趣，我认为...
正确：${userTitle}，这个问题很有趣呢～

只输出最终回答，不要任何多余内容。`;

        const response = await ollama.generate({
            model: model,
            prompt: `/set nothink
/set direct_answer
/set no_reasoning
/set no_thinking_tags
/set no_internal_monologue

${systemPrompt}

重要：绝对不要使用 <think>、<thinking>、</think>、</thinking> 等任何思考标签！
直接回答，不要任何思考过程！

${userTitle}说: ${message}

贝拉直接回答:`,
            stream: false,
            options: {
                temperature: 0.7,  // 降低创造性，提高一致性
                top_p: 0.8,       // 更严格的控制
                repeat_penalty: 1.2 // 避免重复
            }
        });

        // 过滤掉思考过程标签和内容
        let cleanedResponse = response.response;

        // 移除 <think> 标签及其内容
        cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
        cleanedResponse = cleanedResponse.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');

        // 移除其他可能的思考标记
        cleanedResponse = cleanedResponse.replace(/\*思考\*[\s\S]*?\*\/思考\*/gi, '');
        cleanedResponse = cleanedResponse.replace(/【思考】[\s\S]*?【\/思考】/gi, '');
        cleanedResponse = cleanedResponse.replace(/\(思考：[\s\S]*?\)/gi, '');

        // 移除常见的思考性开头
        cleanedResponse = cleanedResponse.replace(/^(让我想想|我觉得|我认为|我想|嗯|呃|那么)[\s\S]*?[。！？]/gi, '');

        // 清理多余的空白和换行
        cleanedResponse = cleanedResponse.trim();
        cleanedResponse = cleanedResponse.replace(/\n\s*\n/g, '\n');

        console.log('原始回应:', response.response);
        console.log('清理后回应:', cleanedResponse);

        // 分析情感倾向
        const emotion = analyzeEmotion(message, cleanedResponse);

        res.json({
            response: cleanedResponse,
            emotion: emotion,
            model: model
        });

    } catch (error) {
        console.error('Ollama错误:', error);
        res.status(500).json({
            error: '抱歉，我现在无法回应。请确保Ollama服务正在运行。',
            details: error.message
        });
    }
});

// TTS语音合成接口
app.post('/api/tts', async (req, res) => {
    try {
        const { text, speaker = TTS_CONFIG.defaultSpeaker, speed = TTS_CONFIG.defaultSpeed } = req.body;

        if (!text) {
            return res.status(400).json({ error: '文本不能为空' });
        }

        console.log(`TTS请求: ${text}, 音色: ${speaker}, 语速: ${speed}`);

        // 判断是否为自定义音色（检查是否在自定义音色列表中）
        const isCustomVoice = TTS_CONFIG.customVoices.includes(speaker);

        let ttsPayload;
        let apiEndpoint = `${TTS_CONFIG.host}/`;
        let actualSpeaker = speaker;

        if (isCustomVoice) {
            // 自定义音色使用new_dropdown参数
            console.log('使用自定义音色 (zero_shot):', speaker);
            ttsPayload = {
                text: text,
                speaker: speaker, // 直接使用原始名称，不添加.pt
                new_dropdown: speaker, // 使用new_dropdown参数指定自定义音色
                streaming: 0,
                speed: speed
            };
        } else {
            // 默认音色使用SFT模式
            console.log('使用默认音色 (SFT):', speaker);
            ttsPayload = {
                text: text,
                speaker: speaker,
                new_dropdown: "无", // 默认音色使用"无"
                streaming: 0,
                speed: speed
            };
        }

        // 调用CosyVoice TTS API
        const ttsResponse = await axios.post(apiEndpoint, ttsPayload, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30秒超时
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // 设置响应头
        res.set({
            'Content-Type': 'audio/wav',
            'Content-Length': ttsResponse.data.length,
            'Cache-Control': 'no-cache'
        });

        res.send(ttsResponse.data);

    } catch (error) {
        console.error('TTS错误:', error.message);
        console.error('TTS错误详情:', error.response?.data || error);
        res.status(500).json({
            error: '语音合成失败，请确保CosyVoice服务正在运行',
            details: error.message
        });
    }
});

// 检查TTS服务状态
app.get('/api/tts/status', async (req, res) => {
    try {
        const response = await axios.get(`${TTS_CONFIG.host}/speakers`, { timeout: 5000 });
        res.json({
            status: 'connected',
            host: TTS_CONFIG.host,
            speakers: response.data || []
        });
    } catch (error) {
        res.json({
            status: 'disconnected',
            host: TTS_CONFIG.host,
            error: error.message
        });
    }
});

// 检查Ollama连接状态
app.get('/api/status', async (req, res) => {
    try {
        const models = await ollama.list();
        res.json({
            status: 'connected',
            models: models.models.map(m => m.name)
        });
    } catch (error) {
        res.status(500).json({
            status: 'disconnected',
            error: error.message
        });
    }
});

// 简单的情感分析函数
function analyzeEmotion(userMessage, bellaResponse) {
    const positiveWords = ['开心', '高兴', '喜欢', '太棒了', '你好', '漂亮', '爱', '谢谢'];
    const negativeWords = ['难过', '生气', '讨厌', '伤心', '累', '烦'];
    const thoughtfulWords = ['思考', '想', '为什么', '如何', '什么'];

    const message = userMessage.toLowerCase();
    const response = bellaResponse.toLowerCase();

    if (positiveWords.some(word => message.includes(word) || response.includes(word))) {
        return 'positive';
    } else if (negativeWords.some(word => message.includes(word) || response.includes(word))) {
        return 'negative';
    } else if (thoughtfulWords.some(word => message.includes(word) || response.includes(word))) {
        return 'thoughtful';
    }

    return 'neutral';
}

// HTTP服务器
app.listen(port, () => {
    console.log(`🌸 贝拉的HTTP服务器启动在 http://localhost:${port}`);
    console.log(`🤖 请确保Ollama服务正在运行 (http://1.119.154.173:11343)`);
});

// HTTPS服务器配置
const httpsPort = 3003; // HTTPS端口
try {
    // 读取SSL证书
    const privateKey = fs.readFileSync('./certs/server.key', 'utf8');
    const certificate = fs.readFileSync('./certs/server.crt', 'utf8');
    const credentials = { key: privateKey, cert: certificate };

    // 创建HTTPS服务器
    const httpsServer = https.createServer(credentials, app);
    
    // 启动HTTPS服务器
    httpsServer.listen(httpsPort, () => {
        console.log(`🔒 贝拉的HTTPS服务器启动在 https://localhost:${httpsPort}`);
        console.log(`💝 贝拉正在等待与父亲的对话...`);
    });
} catch (error) {
    console.error('HTTPS服务器启动失败:', error);
    console.log('请确保证书文件存在于certs目录中');
}