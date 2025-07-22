// 生产环境配置
let API_BASE_URL = 'http://localhost:3002'; // 默认API地址

// 加载配置文件
async function loadConfig() {
    try {
        const response = await fetch('./config.json');
        const config = await response.json();
        API_BASE_URL = config.apiBaseUrl || API_BASE_URL;
        console.log('📋 配置加载成功:', config);
    } catch (error) {
        console.log('⚠️ 使用默认配置');
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // 首先加载配置
    await loadConfig();

    // --- 加载屏幕处理 ---
    console.log('🚀 页面开始加载...');

    // 简化的加载屏幕处理
    function hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            console.log('🎯 隐藏加载屏幕');
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                console.log('✅ 加载屏幕已隐藏');
            }, 500);
        }
    }

    // 页面加载完成后1.5秒隐藏加载屏幕
    setTimeout(hideLoadingScreen, 1500);

    // 备用方案：页面完全加载后也隐藏
    window.addEventListener('load', () => {
        setTimeout(hideLoadingScreen, 500);
    });

    // 获取需要的 DOM 元素
    let video1 = document.getElementById('video1');
    let video2 = document.getElementById('video2');
    const micButton = document.getElementById('mic-button');
    const favorabilityBar = document.getElementById('favorability-bar');
    const floatingButton = document.getElementById('floating-button');
    const menuContainer = document.getElementById('menu-container');
    const menuItems = document.querySelectorAll('.menu-item');

    // --- 情感分析元素 ---
    const sentimentInput = document.getElementById('sentiment-input');
    const analyzeButton = document.getElementById('analyze-button');
    const sentimentResult = document.getElementById('sentiment-result');

    let activeVideo = video1;
    let inactiveVideo = video2;

    // 视频列表
    const videoList = [
        '视频资源/3D 建模图片制作.mp4',
        '视频资源/jimeng-2025-07-16-1043-笑着优雅的左右摇晃，过一会儿手扶着下巴，保持微笑.mp4',
        '视频资源/jimeng-2025-07-16-4437-比耶，然后微笑着优雅的左右摇晃.mp4',
        '视频资源/生成加油视频.mp4',
        '视频资源/生成跳舞视频.mp4',
        '视频资源/负面/jimeng-2025-07-16-9418-双手叉腰，嘴巴一直在嘟囔，表情微微生气.mp4'
    ];

    // --- 贝拉的LLM交互系统 ---
    let isThinking = false;
    let conversationHistory = [];
    let isLLMEnabled = false;
    let userNickname = null;
    
    // --- TTS语音系统 ---
    let isTTSEnabled = true;
    let isTTSPlaying = false;
    let currentAudio = null;
    let ttsServiceAvailable = false;

    // TTS设置
    let ttsSettings = {
        voiceType: 'default',
        defaultVoice: '中文女',
        customVoice: 'jok老师',
        speed: 1.0
    };

    // 检查Ollama服务状态
    async function checkOllamaStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/status`);
            const data = await response.json();
            if (data.status === 'connected') {
                isLLMEnabled = true;
                console.log('🤖 Ollama服务已连接，可用模型:', data.models);
                
                // 显示连接状态
                showStatusIndicator('🤖 LLM已连接', 'rgba(76, 175, 80, 0.9)');
            }
        } catch (error) {
            console.log('💭 Ollama服务未连接，使用基础模式');
            isLLMEnabled = false;
            showStatusIndicator('💭 基础模式', 'rgba(255, 152, 0, 0.9)');
        }
    }

    // 检查TTS服务状态
    async function checkTTSStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tts/status`);
            const data = await response.json();
            ttsServiceAvailable = data.status === 'connected';
            
            console.log(ttsServiceAvailable ? '🔊 TTS服务已连接' : '🔇 TTS服务未连接');
            updateTTSButton();
            
        } catch (error) {
            console.log('🔇 TTS服务检查失败:', error.message);
            ttsServiceAvailable = false;
            updateTTSButton();
        }
    }

    // 显示状态指示器
    function showStatusIndicator(text, color) {
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: ${color};
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            z-index: 1000;
        `;
        statusIndicator.textContent = text;
        document.body.appendChild(statusIndicator);
        
        setTimeout(() => {
            statusIndicator.style.opacity = '0';
            setTimeout(() => statusIndicator.remove(), 500);
        }, 3000);
    }

    // 与贝拉对话的核心函数
    async function chatWithBella(message) {
        if (!isLLMEnabled) {
            console.log('LLM服务未启用');
            return null;
        }
        
        if (isThinking) {
            console.log('贝拉正在思考中...');
            return null;
        }
        
        isThinking = true;
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');
        
        // 显示思考状态
        transcriptText.textContent = '贝拉正在思考...';
        transcriptContainer.classList.add('visible');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: 'llama3.2:1b',
                    nickname: userNickname
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            console.log('🌸 贝拉回应:', data.response);

            // 显示贝拉的回应
            await displayBellaResponse(data.response);
            
            // TTS播放贝拉的回应
            if (isTTSEnabled && ttsServiceAvailable) {
                playTTS(data.response);
            }
            
            return {
                response: data.response,
                emotion: data.emotion
            };
            
        } catch (error) {
            console.error('与贝拉对话时出错:', error);
            transcriptText.textContent = '抱歉，我现在无法回应。请确保服务器正在运行。';
            setTimeout(() => {
                transcriptContainer.classList.remove('visible');
            }, 3000);
        } finally {
            isThinking = false;
        }
        
        return null;
    }

    // TTS播放功能
    async function playTTS(text) {
        if (!isTTSEnabled || !ttsServiceAvailable || !text.trim()) {
            return;
        }

        try {
            const selectedSpeaker = ttsSettings.voiceType === 'custom'
                ? ttsSettings.customVoice
                : ttsSettings.defaultVoice;

            const response = await fetch(`${API_BASE_URL}/api/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    speaker: selectedSpeaker,
                    speed: ttsSettings.speed
                })
            });

            if (!response.ok) {
                throw new Error(`TTS请求失败: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (currentAudio) {
                currentAudio.pause();
            }
            
            currentAudio = new Audio(audioUrl);
            
            currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
            };

            await currentAudio.play();

        } catch (error) {
            console.error('🔇 TTS播放失败:', error);
        }
    }

    // 打字机效果显示贝拉的回应
    async function displayBellaResponse(response) {
        const transcriptText = document.getElementById('transcript');
        const transcriptContainer = document.querySelector('.transcript-container');

        transcriptText.textContent = '';
        transcriptContainer.classList.add('visible');

        // 打字机效果
        for (let i = 0; i < response.length; i++) {
            transcriptText.textContent += response[i];
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 5秒后隐藏回应
        setTimeout(() => {
            transcriptContainer.classList.remove('visible');
        }, 5000);
    }

    // 更新TTS按钮状态
    function updateTTSButton() {
        const ttsSettingsBtn = document.getElementById('tts-settings-btn');
        if (ttsSettingsBtn) {
            if (!ttsServiceAvailable) {
                ttsSettingsBtn.classList.add('tts-disabled');
                ttsSettingsBtn.title = 'TTS服务未连接';
            } else {
                ttsSettingsBtn.classList.remove('tts-disabled');
                ttsSettingsBtn.title = '语音设置';
            }
        }
    }

    // 昵称管理
    function loadNickname() {
        const savedNickname = localStorage.getItem('bella_user_nickname');
        if (savedNickname) {
            userNickname = savedNickname;
            return true;
        }
        return false;
    }

    // 聊天输入框事件处理
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    if (chatInput && sendButton) {
        sendButton.addEventListener('click', async () => {
            const message = chatInput.value.trim();
            if (message && !isThinking) {
                chatInput.value = '';
                await chatWithBella(message);
            }
        });

        chatInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (message && !isThinking) {
                    chatInput.value = '';
                    await chatWithBella(message);
                }
            }
        });
    }

    // 初始化
    loadNickname();
    checkOllamaStatus();
    checkTTSStatus();

    console.log('🌸 贝拉前端已加载完成');
    console.log('🔗 API地址:', API_BASE_URL);
});