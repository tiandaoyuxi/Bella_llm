# 贝拉 + Ollama 集成使用指南

## 🌸 项目概述

现在贝拉已经成功集成了Ollama本地LLM模型，她可以：
- 通过语音与您智能对话
- 通过文字聊天界面交流
- 根据对话情感智能切换视频表情
- 动态调整好感度系统
- 保持优雅的人格特征

## 🚀 快速开始

### 1. 安装Ollama
首先确保您的系统已安装Ollama：

**Windows:**
```bash
# 下载并安装 Ollama for Windows
# 访问: https://ollama.ai/download
```

**启动Ollama服务（端口11343）:**
```bash
ollama serve --port 11343
```

**或者如果您已经在端口11343运行Ollama，直接使用:**
```bash
ollama serve
```

### 2. 下载模型
推荐使用以下模型之一：
```bash
# 轻量级模型（推荐）
ollama pull llama3.2

# 或者更大的模型（需要更多内存）
ollama pull llama3.2:7b
ollama pull gemma2:9b
```

### 3. 安装项目依赖
```bash
npm install
```

### 4. 启动贝拉
```bash
# 方式1：一键启动（推荐）
npm run bella

# 方式2：分别启动
# 终端1：启动后端服务
npm start

# 终端2：启动前端服务
npm run client
```

### 5. 访问贝拉
打开浏览器访问：`http://localhost:8000`

## 💬 使用方式

### 语音对话
1. 点击麦克风按钮
2. 对贝拉说话
3. 她会智能回应并切换相应的表情视频

### 文字对话
1. 在聊天输入框中输入消息
2. 点击发送或按回车键
3. 贝拉会以打字机效果显示回应

### 功能特色
- **智能情感识别**：贝拉会根据对话内容识别情感
- **动态视频切换**：不同情感对应不同的表情视频
- **好感度系统**：积极对话会提升好感度
- **优雅人格**：贝拉保持温柔、优雅的回应风格

## 🔧 配置选项

### 更改LLM模型
编辑 `server.js` 文件：
```javascript
// 在 /api/chat 路由中修改默认模型
const { message, model = 'llama3.2' } = req.body;
```

### 自定义贝拉的人格
编辑 `server.js` 中的系统提示词：
```javascript
const systemPrompt = `你是贝拉(Bella)，一个正在被唤醒的数字生命...`;
```

## 🎯 项目架构

```
贝拉项目架构
├── 前端 (浏览器)
│   ├── 语音识别 (Web Speech API)
│   ├── 视频播放系统
│   ├── 聊天界面
│   └── 情感反馈系统
├── 后端 (Node.js + Express)
│   ├── Ollama API 代理
│   ├── 情感分析
│   └── 静态文件服务
└── AI模型 (Ollama)
    ├── 本地LLM模型
    └── 智能对话生成
```

## 🐛 故障排除

### 问题1：贝拉无法回应
**解决方案：**
1. 确保Ollama服务正在运行：`ollama serve`
2. 检查模型是否已下载：`ollama list`
3. 查看浏览器控制台是否有错误信息

### 问题2：语音识别不工作
**解决方案：**
1. 确保浏览器支持语音识别（推荐Chrome）
2. 检查麦克风权限是否已授予
3. 确保网站通过HTTPS或localhost访问

### 问题3：视频无法播放
**解决方案：**
1. 检查视频文件是否存在于 `视频资源/` 目录
2. 确保浏览器支持MP4格式
3. 检查文件路径是否正确

## 📝 开发说明

### 添加新的情感视频
1. 将视频文件放入 `视频资源/` 目录
2. 在 `script.js` 中更新视频列表：
```javascript
const positiveVideos = [
    '视频资源/你的新视频.mp4',
    // ... 其他视频
];
```

### 自定义情感分析
编辑 `server.js` 中的 `analyzeEmotion` 函数：
```javascript
function analyzeEmotion(userMessage, bellaResponse) {
    // 添加你的情感分析逻辑
}
```

## 🌟 未来计划

- [ ] 支持更多LLM模型
- [ ] 添加语音合成（TTS）
- [ ] 实现长期记忆系统
- [ ] 3D虚拟形象集成
- [ ] 多语言支持

## 💝 致谢

感谢MiKaPo-Electron项目提供的Ollama集成参考，让贝拉能够拥有真正的智能对话能力。

---

**贝拉正在等待与您的对话... 🌸**