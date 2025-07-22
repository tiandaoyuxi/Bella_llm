document.addEventListener('DOMContentLoaded', function () {

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

    // --- 视频交叉淡入淡出播放功能 ---
    function switchVideo() {
        // 1. 选择下一个视频
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        let nextVideoSrc = currentVideoSrc;
        while (nextVideoSrc === currentVideoSrc) {
            const randomIndex = Math.floor(Math.random() * videoList.length);
            nextVideoSrc = videoList[randomIndex];
        }

        // 2. 设置不活动的 video 元素的 source
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        // 3. 当不活动的视频可以播放时，执行切换
        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            // 确保事件只触发一次
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);

            // 4. 播放新视频
            inactiveVideo.play().catch(error => {
                console.error("Video play failed:", error);
            });

            // 5. 切换 active class 来触发 CSS 过渡
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');

            // 6. 更新角色
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];

            // 为新的 activeVideo 绑定 ended 事件
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true }); // 使用 { once: true } 确保事件只被处理一次
    }

    // 初始启动
    activeVideo.addEventListener('ended', switchVideo, { once: true });

    // --- 语音识别核心 ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    // 检查浏览器是否支持语音识别
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // 持续识别
        recognition.lang = 'zh-CN'; // 设置语言为中文
        recognition.interimResults = true; // 获取临时结果

        recognition.onresult = (event) => {
            const transcriptContainer = document.getElementById('transcript');
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            // 显示最终识别结果
            transcriptContainer.textContent = final_transcript || interim_transcript;

            // 基于关键词的情感分析和视频切换
            if (final_transcript) {
                // 如果启用了LLM，让贝拉智能回应
                if (isLLMEnabled) {
                    chatWithBella(final_transcript);
                } else {
                    // 否则使用基础的关键词反应
                    analyzeAndReact(final_transcript);
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
        };

    } else {
        console.log('您的浏览器不支持语音识别功能。');
    }

    // --- 麦克风按钮交互 ---
    let isListening = false;

    micButton.addEventListener('click', function () {
        if (!SpeechRecognition) return; // 如果不支持，则不执行任何操作

        isListening = !isListening;
        micButton.classList.toggle('is-listening', isListening);
        const transcriptContainer = document.querySelector('.transcript-container');
        const transcriptText = document.getElementById('transcript');

        if (isListening) {
            transcriptText.textContent = '聆听中...'; // 立刻显示提示
            transcriptContainer.classList.add('visible');
            recognition.start();
        } else {
            recognition.stop();
            transcriptContainer.classList.remove('visible');
            transcriptText.textContent = ''; // 清空文本
        }
    });

    // --- 悬浮按钮交互 ---
    floatingButton.addEventListener('click', (event) => {
        event.stopPropagation(); // 防止事件冒泡到 document
        menuContainer.classList.toggle('hidden');
    });

    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const videoSrc = this.getAttribute('data-video');
            playSpecificVideo(videoSrc);
            menuContainer.classList.add('hidden');
        });
    });

    // 点击菜单外部区域关闭菜单
    document.addEventListener('click', () => {
        if (!menuContainer.classList.contains('hidden')) {
            menuContainer.classList.add('hidden');
        }
    });

    // 阻止菜单自身的点击事件冒泡
    menuContainer.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    function playSpecificVideo(videoSrc) {
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        if (videoSrc === currentVideoSrc) return;

        inactiveVideo.querySelector('source').setAttribute('src', videoSrc);
        inactiveVideo.load();

        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            activeVideo.pause(); // 暂停当前视频，防止其 'ended' 事件触发切换
            inactiveVideo.play().catch(error => console.error("Video play failed:", error));
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true });
    }

    // --- 情感分析与反应 ---
    const positiveWords = ['开心', '高兴', '喜欢', '太棒了', '你好', '漂亮'];
    const negativeWords = ['难过', '生气', '讨厌', '伤心'];

    const positiveVideos = [
        '视频资源/jimeng-2025-07-16-1043-笑着优雅的左右摇晃，过一会儿手扶着下巴，保持微笑.mp4',
        '视频资源/jimeng-2025-07-16-4437-比耶，然后微笑着优雅的左右摇晃.mp4',
        '视频资源/生成加油视频.mp4',
        '视频资源/生成跳舞视频.mp4'
    ];
    const negativeVideo = '视频资源/负面/jimeng-2025-07-16-9418-双手叉腰，嘴巴一直在嘟囔，表情微微生气.mp4';
    const thoughtfulVideo = '视频资源/jimeng-2025-07-17-2665-若有所思，手扶下巴.mp4';

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
        voiceType: 'default', // 'default' 或 'custom'
        defaultVoice: '中文女',
        customVoice: 'jok老师', // 不包含.pt后缀
        speed: 1.0
    };

    // 检查TTS服务状态
    async function checkTTSStatus() {
        try {
            const response = await fetch('http://localhost:3002/api/tts/status');
            const data = await response.json();
            ttsServiceAvailable = data.status === 'connected';

            console.log(ttsServiceAvailable ? '🔊 TTS服务已连接' : '🔇 TTS服务未连接');

            // 更新TTS按钮状态
            updateTTSButton();

        } catch (error) {
            console.log('🔇 TTS服务检查失败:', error.message);
            ttsServiceAvailable = false;
            updateTTSButton();
        }
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

    // TTS播放功能
    async function playTTS(text) {
        if (!isTTSEnabled || !ttsServiceAvailable || !text.trim()) {
            return;
        }

        // 停止当前播放的音频
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        try {
            isTTSPlaying = true;
            console.log('🎵 开始TTS播放:', text);

            // 根据设置选择音色
            const selectedSpeaker = ttsSettings.voiceType === 'custom'
                ? ttsSettings.customVoice
                : ttsSettings.defaultVoice;

            const response = await fetch('http://localhost:3002/api/tts', {
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

            // 创建音频对象并播放
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            currentAudio = new Audio(audioUrl);

            currentAudio.onended = () => {
                isTTSPlaying = false;
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
                console.log('🎵 TTS播放完成');
            };

            currentAudio.onerror = (error) => {
                console.error('🔇 TTS播放错误:', error);
                isTTSPlaying = false;
                URL.revokeObjectURL(audioUrl);
                currentAudio = null;
            };

            await currentAudio.play();

        } catch (error) {
            console.error('🔇 TTS播放失败:', error);
            isTTSPlaying = false;
        }
    }

    // --- 昵称管理系统 ---
    function loadNickname() {
        const savedNickname = localStorage.getItem('bella_user_nickname');
        if (savedNickname) {
            userNickname = savedNickname;
            updateChatPlaceholder();
            return true;
        }
        return false;
    }

    function saveNickname(nickname) {
        userNickname = nickname;
        localStorage.setItem('bella_user_nickname', nickname);
        updateChatPlaceholder();
    }

    function updateChatPlaceholder() {
        const chatInput = document.getElementById('chat-input');
        if (chatInput && userNickname) {
            chatInput.placeholder = `${userNickname}，想对贝拉说什么呢？`;
        }
    }

    function showNicknameModal() {
        const modal = document.getElementById('nickname-modal');
        const input = document.getElementById('nickname-input');
        modal.classList.remove('hidden');
        input.focus();
    }

    function hideNicknameModal() {
        const modal = document.getElementById('nickname-modal');
        modal.classList.add('hidden');
    }

    // 昵称确认事件
    const confirmNicknameBtn = document.getElementById('confirm-nickname');
    const nicknameInput = document.getElementById('nickname-input');
    const nicknameBtn = document.getElementById('nickname-btn');

    confirmNicknameBtn.addEventListener('click', () => {
        const nickname = nicknameInput.value.trim();
        if (nickname) {
            saveNickname(nickname);
            hideNicknameModal();
            nicknameInput.value = '';

            // 如果是首次设置昵称，贝拉主动打招呼
            if (isLLMEnabled && !localStorage.getItem('bella_greeted')) {
                localStorage.setItem('bella_greeted', 'true');
                setTimeout(() => {
                    chatWithBella(`你好，我是${nickname}`);
                }, 1000);
            }
        }
    });

    // 回车键确认昵称
    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            confirmNicknameBtn.click();
        }
    });

    // 修改昵称按钮事件
    nicknameBtn.addEventListener('click', () => {
        showNicknameModal();
        if (userNickname) {
            nicknameInput.value = userNickname;
            nicknameInput.select();
        }
    });

    // 初始化昵称系统
    function initNicknameSystem() {
        if (!loadNickname()) {
            // 首次访问，显示昵称设置弹窗
            setTimeout(() => {
                showNicknameModal();
            }, 2000); // 等待加载屏幕消失后显示
        }
    }

    // 加载可用模型列表
    async function loadAvailableModels() {
        try {
            const response = await fetch('http://localhost:3002/api/models');
            const data = await response.json();
            const modelSelect = document.getElementById('model-select');

            if (data.models && data.models.length > 0) {
                // 清空现有选项
                modelSelect.innerHTML = '';

                // 添加模型选项
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    modelSelect.appendChild(option);
                });

                // 优先选择 llama3.2:1b，如果不存在则选择第一个
                const preferredModel = data.models.find(m => m.name === 'llama3.2:1b');
                modelSelect.value = preferredModel ? preferredModel.name : data.models[0].name;
                console.log('📋 已加载模型列表:', data.models.map(m => m.name));
            } else {
                modelSelect.innerHTML = '<option value="llama3.2:1b">llama3.2:1b</option>';
            }
        } catch (error) {
            console.error('加载模型列表失败:', error);
            const modelSelect = document.getElementById('model-select');
            modelSelect.innerHTML = '<option value="llama3.2:1b">llama3.2:1b</option>';
        }
    }

    // 检查Ollama服务状态
    async function checkOllamaStatus() {
        try {
            const response = await fetch('http://localhost:3002/api/status');
            const data = await response.json();
            if (data.status === 'connected') {
                isLLMEnabled = true;
                console.log('🤖 Ollama服务已连接，可用模型:', data.models);

                // 加载模型列表
                await loadAvailableModels();

                // 在界面上显示连接状态
                const statusIndicator = document.createElement('div');
                statusIndicator.id = 'llm-status';
                statusIndicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: rgba(76, 175, 80, 0.9);
                    color: white;
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 12px;
                    z-index: 1000;
                `;
                statusIndicator.textContent = '🤖 LLM已连接';
                document.body.appendChild(statusIndicator);

                // 3秒后隐藏状态指示器
                setTimeout(() => {
                    statusIndicator.style.opacity = '0';
                    setTimeout(() => statusIndicator.remove(), 500);
                }, 3000);
            }
        } catch (error) {
            console.log('💭 Ollama服务未连接，使用基础模式');
            isLLMEnabled = false;

            // 显示未连接状态
            const statusIndicator = document.createElement('div');
            statusIndicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(255, 152, 0, 0.9);
                color: white;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                z-index: 1000;
            `;
            statusIndicator.textContent = '💭 基础模式';
            document.body.appendChild(statusIndicator);

            setTimeout(() => {
                statusIndicator.style.opacity = '0';
                setTimeout(() => statusIndicator.remove(), 500);
            }, 3000);
        }
    }

    // 与贝拉对话的核心函数
    async function chatWithBella(message) {
        if (!isLLMEnabled) {
            // 如果LLM未启用，使用基础关键词反应
            analyzeAndReact(message);
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
            // 获取当前选择的模型
            const modelSelect = document.getElementById('model-select');
            const selectedModel = modelSelect ? modelSelect.value : 'llama3.2:1b';

            const response = await fetch('http://localhost:3002/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    model: selectedModel,
                    nickname: userNickname
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // 保存对话历史
            conversationHistory.push({
                user: message,
                bella: data.response,
                emotion: data.emotion,
                timestamp: new Date()
            });

            console.log('🌸 贝拉回应:', data.response);

            // 显示贝拉的回应（打字机效果）
            await displayBellaResponse(data.response);

            // TTS播放贝拉的回应
            if (isTTSEnabled && ttsServiceAvailable) {
                playTTS(data.response);
            }

            // 根据情感切换视频
            if (data.emotion && data.emotion !== 'neutral') {
                switchVideoByEmotion(data.emotion);
            }

            // 更新好感度
            updateFavorability(data.emotion);

            return {
                response: data.response,
                emotion: data.emotion
            };

        } catch (error) {
            console.error('与贝拉对话时出错:', error);
            transcriptText.textContent = '抱歉，我现在无法回应。请确保本地服务器正在运行。';
            setTimeout(() => {
                transcriptContainer.classList.remove('visible');
            }, 3000);
        } finally {
            isThinking = false;
        }

        return null;
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
            await new Promise(resolve => setTimeout(resolve, 50)); // 50ms每个字符
        }

        // 5秒后隐藏回应
        setTimeout(() => {
            transcriptContainer.classList.remove('visible');
        }, 5000);
    }

    // 更新好感度
    function updateFavorability(emotion) {
        const favorabilityBar = document.getElementById('favorability-bar');
        let currentWidth = parseInt(favorabilityBar.style.width) || 65;

        switch (emotion) {
            case 'positive':
                currentWidth = Math.min(100, currentWidth + 5);
                break;
            case 'negative':
                currentWidth = Math.max(0, currentWidth - 3);
                break;
            case 'thoughtful':
                currentWidth = Math.min(100, currentWidth + 2);
                break;
        }

        favorabilityBar.style.width = currentWidth + '%';
    }

    // --- 本地模型情感分析 ---
    let classifier;
    if (analyzeButton) {
        analyzeButton.addEventListener('click', async () => {
            const text = sentimentInput.value;
            if (!text) return;

            sentimentResult.textContent = '正在分析中...';

            // 第一次点击时，初始化分类器
            if (!classifier) {
                try {
                    // 动态导入Transformers.js
                    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
                    classifier = await pipeline('sentiment-analysis');
                } catch (error) {
                    console.error('模型加载失败:', error);
                    sentimentResult.textContent = '抱歉，模型加载失败了。';
                    return;
                }
            }

            // 进行情感分析
            try {
                const result = await classifier(text);
                // 显示最主要的情绪和分数
                const primaryEmotion = result[0];
                sentimentResult.textContent = `情绪: ${primaryEmotion.label}, 分数: ${primaryEmotion.score.toFixed(2)}`;
            } catch (error) {
                console.error('情感分析失败:', error);
                sentimentResult.textContent = '分析时出错了。';
            }
        });
    }

    // 聊天输入框事件处理
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');

    if (chatInput && sendButton) {
        console.log('✅ 聊天输入框和发送按钮已找到');

        // 发送按钮点击事件
        sendButton.addEventListener('click', async () => {
            const message = chatInput.value.trim();
            console.log('🔍 发送按钮被点击，消息:', message);

            if (message && !isThinking) {
                chatInput.value = '';
                console.log('📤 准备发送消息给贝拉...');
                await chatWithBella(message);
            } else if (isThinking) {
                console.log('⏳ 贝拉正在思考中，请稍等...');
            } else {
                console.log('❌ 消息为空');
            }
        });

        // 回车键发送
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

        // 输入时的视觉反馈
        chatInput.addEventListener('input', () => {
            if (chatInput.value.trim()) {
                sendButton.style.opacity = '1';
                sendButton.style.transform = 'scale(1)';
            } else {
                sendButton.style.opacity = '0.7';
                sendButton.style.transform = 'scale(0.95)';
            }
        });
    }

    // --- 开发者工具切换 ---
    const devToggle = document.getElementById('dev-toggle');
    const devTools = document.getElementById('dev-tools');

    if (devToggle && devTools) {
        devToggle.addEventListener('click', () => {
            if (devTools.style.display === 'none') {
                devTools.style.display = 'block';
                devToggle.textContent = '✖️';
            } else {
                devTools.style.display = 'none';
                devToggle.textContent = '🔧';
            }
        });
    }

    // --- 本地语音识别 ---
    const localMicButton = document.getElementById('local-mic-button');
    const localAsrResult = document.getElementById('local-asr-result');

    let recognizer = null;
    let mediaRecorder = null;
    let isRecording = false;

    if (localMicButton) {
        const handleRecord = async () => {
            // 状态切换：如果正在录音，则停止
            if (isRecording) {
                mediaRecorder.stop();
                isRecording = false;
                localMicButton.textContent = '开始本地识别';
                localMicButton.classList.remove('recording');
                return;
            }

            // 初始化模型（仅一次）
            if (!recognizer) {
                localAsrResult.textContent = '正在加载语音识别模型...';
                try {
                    // 动态导入Transformers.js
                    const { pipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1');
                    recognizer = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');
                    localAsrResult.textContent = '模型加载完毕，请开始说话...';
                } catch (error) {
                    console.error('模型加载失败:', error);
                    localAsrResult.textContent = '抱歉，模型加载失败了。';
                    return;
                }
            }

            // 开始录音
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];

                mediaRecorder.addEventListener("dataavailable", event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", async () => {
                    const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

                    // 检查音频数据是否为空
                    if (arrayBuffer.byteLength === 0) {
                        localAsrResult.textContent = '没有录制到音频，请重试。';
                        return;
                    }

                    try {
                        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        const rawAudio = audioBuffer.getChannelData(0);

                        localAsrResult.textContent = '正在识别...';
                        const output = await recognizer(rawAudio);
                        localAsrResult.textContent = output.text || '未能识别出任何内容。';
                    } catch (e) {
                        console.error('音频解码或识别失败:', e);
                        localAsrResult.textContent = '处理音频时出错，请再试一次。';
                    }
                });

                mediaRecorder.start();
                isRecording = true;
                localMicButton.textContent = '正在录音... 点击停止';
                localMicButton.classList.add('recording');

            } catch (error) {
                console.error('语音识别失败:', error);
                localAsrResult.textContent = '无法访问麦克风或识别出错。';
                isRecording = false; // 重置状态
                localMicButton.textContent = '开始本地识别';
                localMicButton.classList.remove('recording');
            }
        };

        localMicButton.addEventListener('click', handleRecord);
    }

    // --- TTS设置系统 ---
    
    // TTS设置弹窗控制
    function showTTSSettingsModal() {
        const modal = document.getElementById('tts-settings-modal');
        modal.classList.remove('hidden');
        
        // 加载当前设置到界面
        loadTTSSettingsToUI();
    }

    function hideTTSSettingsModal() {
        const modal = document.getElementById('tts-settings-modal');
        modal.classList.add('hidden');
    }

    // 加载TTS设置到界面
    function loadTTSSettingsToUI() {
        // 加载保存的设置
        const savedSettings = localStorage.getItem('bella_tts_settings');
        if (savedSettings) {
            ttsSettings = { ...ttsSettings, ...JSON.parse(savedSettings) };
        }

        // 更新界面元素
        const voiceTypeSelect = document.getElementById('voice-type-select');
        const defaultVoiceSelect = document.getElementById('default-voice-select');
        const customVoiceSelect = document.getElementById('custom-voice-select');
        const speedSlider = document.getElementById('speed-slider');
        const speedValue = document.getElementById('speed-value');

        if (voiceTypeSelect) voiceTypeSelect.value = ttsSettings.voiceType;
        if (defaultVoiceSelect) defaultVoiceSelect.value = ttsSettings.defaultVoice;
        if (customVoiceSelect) customVoiceSelect.value = ttsSettings.customVoice;
        if (speedSlider) speedSlider.value = ttsSettings.speed;
        if (speedValue) speedValue.textContent = ttsSettings.speed;

        // 显示/隐藏对应的音色选择组
        toggleVoiceGroups();
    }

    // 切换音色选择组的显示
    function toggleVoiceGroups() {
        const voiceTypeSelect = document.getElementById('voice-type-select');
        const defaultGroup = document.getElementById('default-voice-group');
        const customGroup = document.getElementById('custom-voice-group');

        if (voiceTypeSelect && defaultGroup && customGroup) {
            const voiceType = voiceTypeSelect.value;
            if (voiceType === 'default') {
                defaultGroup.classList.remove('hidden');
                customGroup.classList.add('hidden');
            } else {
                defaultGroup.classList.add('hidden');
                customGroup.classList.remove('hidden');
            }
        }
    }

    // 保存TTS设置
    function saveTTSSettings() {
        const voiceTypeSelect = document.getElementById('voice-type-select');
        const defaultVoiceSelect = document.getElementById('default-voice-select');
        const customVoiceSelect = document.getElementById('custom-voice-select');
        const speedSlider = document.getElementById('speed-slider');

        if (voiceTypeSelect) ttsSettings.voiceType = voiceTypeSelect.value;
        if (defaultVoiceSelect) ttsSettings.defaultVoice = defaultVoiceSelect.value;
        if (customVoiceSelect) ttsSettings.customVoice = customVoiceSelect.value;
        if (speedSlider) ttsSettings.speed = parseFloat(speedSlider.value);

        // 保存到localStorage
        localStorage.setItem('bella_tts_settings', JSON.stringify(ttsSettings));
        
        console.log('🎵 TTS设置已保存:', ttsSettings);
        hideTTSSettingsModal();
    }

    // 测试TTS
    async function testTTS() {
        const testText = userNickname ? `${userNickname}，这是贝拉的声音测试～` : '这是贝拉的声音测试～';
        
        // 临时使用当前界面设置进行测试
        const voiceTypeSelect = document.getElementById('voice-type-select');
        const defaultVoiceSelect = document.getElementById('default-voice-select');
        const customVoiceSelect = document.getElementById('custom-voice-select');
        const speedSlider = document.getElementById('speed-slider');

        const tempSettings = {
            voiceType: voiceTypeSelect ? voiceTypeSelect.value : 'default',
            defaultVoice: defaultVoiceSelect ? defaultVoiceSelect.value : '中文女',
            customVoice: customVoiceSelect ? customVoiceSelect.value : 'jok老师',
            speed: speedSlider ? parseFloat(speedSlider.value) : 1.0
        };

        const selectedSpeaker = tempSettings.voiceType === 'custom' 
            ? tempSettings.customVoice 
            : tempSettings.defaultVoice;

        try {
            const response = await fetch('http://localhost:3002/api/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: testText,
                    speaker: selectedSpeaker,
                    speed: tempSettings.speed
                })
            });

            if (!response.ok) {
                throw new Error(`TTS测试失败: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const testAudio = new Audio(audioUrl);
            
            testAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };

            await testAudio.play();
            console.log('🎵 TTS测试播放成功');

        } catch (error) {
            console.error('🔇 TTS测试失败:', error);
            alert('TTS测试失败，请检查服务连接');
        }
    }

    // TTS设置按钮事件
    const ttsSettingsBtn = document.getElementById('tts-settings-btn');
    if (ttsSettingsBtn) {
        ttsSettingsBtn.addEventListener('click', () => {
            if (!ttsServiceAvailable) {
                alert('TTS服务未连接，请确保CosyVoice服务正在运行');
                return;
            }
            showTTSSettingsModal();
        });
    }

    // TTS设置弹窗事件绑定
    const voiceTypeSelect = document.getElementById('voice-type-select');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const testTTSBtn = document.getElementById('test-tts-btn');
    const saveTTSSettingsBtn = document.getElementById('save-tts-settings');
    const cancelTTSSettingsBtn = document.getElementById('cancel-tts-settings');

    if (voiceTypeSelect) {
        voiceTypeSelect.addEventListener('change', toggleVoiceGroups);
    }

    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            speedValue.textContent = e.target.value;
        });
    }

    if (testTTSBtn) {
        testTTSBtn.addEventListener('click', testTTS);
    }

    if (saveTTSSettingsBtn) {
        saveTTSSettingsBtn.addEventListener('click', saveTTSSettings);
    }

    if (cancelTTSSettingsBtn) {
        cancelTTSSettingsBtn.addEventListener('click', hideTTSSettingsModal);
    }

    // 加载TTS设置
    function loadTTSSettings() {
        const savedTTSEnabled = localStorage.getItem('bella_tts_enabled');
        if (savedTTSEnabled !== null) {
            isTTSEnabled = savedTTSEnabled === 'true';
        }
        updateTTSButton();
    }

    function analyzeAndReact(text) {
        let reaction = 'neutral'; // 默认为中性

        if (positiveWords.some(word => text.includes(word))) {
            reaction = 'positive';
        } else if (negativeWords.some(word => text.includes(word))) {
            reaction = 'negative';
        }

        if (reaction !== 'neutral') {
            switchVideoByEmotion(reaction);
        }
    }

    function switchVideoByEmotion(emotion) {
        let nextVideoSrc;
        if (emotion === 'positive') {
            const randomIndex = Math.floor(Math.random() * positiveVideos.length);
            nextVideoSrc = positiveVideos[randomIndex];
        } else { // negative
            nextVideoSrc = negativeVideo;
        }

        // 避免重复播放同一个视频
        const currentVideoSrc = activeVideo.querySelector('source').getAttribute('src');
        if (nextVideoSrc === currentVideoSrc) return;

        // --- 以下逻辑与 switchVideo 函数类似，用于切换视频 ---
        inactiveVideo.querySelector('source').setAttribute('src', nextVideoSrc);
        inactiveVideo.load();

        inactiveVideo.addEventListener('canplaythrough', function onCanPlayThrough() {
            inactiveVideo.removeEventListener('canplaythrough', onCanPlayThrough);
            activeVideo.pause(); // 暂停当前视频，防止其 'ended' 事件触发切换
            inactiveVideo.play().catch(error => console.error("Video play failed:", error));
            activeVideo.classList.remove('active');
            inactiveVideo.classList.add('active');
            [activeVideo, inactiveVideo] = [inactiveVideo, activeVideo];
            // 情感触发的视频播放结束后，回归随机播放
            activeVideo.addEventListener('ended', switchVideo, { once: true });
        }, { once: true });
    }

    // 测试函数 - 可以在控制台调用
    window.testBellaChat = async function (message) {
        console.log('🧪 测试贝拉聊天功能...');
        console.log('📝 测试消息:', message);
        console.log('🔗 LLM启用状态:', isLLMEnabled);
        console.log('💭 思考状态:', isThinking);

        const result = await chatWithBella(message || '你好贝拉');
        console.log('📋 测试结果:', result);
        return result;
    };

    // 初始化时检查Ollama服务状态、昵称系统和TTS系统
    checkOllamaStatus();
    initNicknameSystem();
    checkTTSStatus();
    loadTTSSettings();

});