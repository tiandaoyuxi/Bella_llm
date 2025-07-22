# 贝拉项目 NPM 使用指南

## 📦 可用的NPM命令

### 🚀 启动命令

```bash
# 一键启动贝拉（推荐）
npm run bella
# 同时启动后端服务器和前端服务

# 仅启动后端服务器
npm start
# 启动Ollama代理服务器 (端口3001)

# 开发模式（自动重启）
npm run dev
# 使用nodemon，代码修改时自动重启

# 仅启动前端服务
npm run client
# 启动静态文件服务器 (端口8000)
```

## 🔧 安装和设置

### 首次安装
```bash
# 安装所有依赖
npm install

# 如果遇到权限问题（Windows）
npm install --force
```

### 依赖说明

**核心依赖：**
- `express` - Web服务器框架
- `ollama` - Ollama API客户端
- `cors` - 跨域资源共享
- `@xenova/transformers` - 本地AI模型

**开发依赖：**
- `nodemon` - 开发时自动重启
- `concurrently` - 同时运行多个命令

## 🌐 端口配置

| 服务 | 端口 | 用途 |
|------|------|------|
| 前端 | 8000 | 贝拉主界面 |
| 后端 | 3001 | API服务器 |
| Ollama | 11434 | LLM模型服务 |

## 🐛 常见问题解决

### 问题1：端口被占用
```bash
# 查看端口占用
netstat -ano | findstr :3001
netstat -ano | findstr :8000

# 杀死占用进程（Windows）
taskkill /PID <进程ID> /F
```

### 问题2：依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rmdir /s node_modules
npm install
```

### 问题3：Ollama连接失败
```bash
# 检查Ollama是否运行
curl http://localhost:11434/api/tags

# 启动Ollama服务
ollama serve
```

## 🔄 开发工作流

### 日常开发
```bash
# 1. 启动开发环境
npm run bella

# 2. 修改代码后，后端会自动重启
# 3. 前端刷新浏览器即可看到更改
```

### 调试模式
```bash
# 分别启动服务，便于调试
# 终端1
npm run dev

# 终端2  
npm run client

# 终端3（可选）
ollama serve
```

## 📝 自定义配置

### 修改端口
编辑相应文件：

**后端端口 (server.js):**
```javascript
const port = 3001; // 修改为你想要的端口
```

**前端端口:**
```bash
# 修改package.json中的client命令
"client": "python -m http.server 9000"
```

### 添加新的NPM脚本
在 `package.json` 中添加：
```json
{
  "scripts": {
    "test": "echo \"测试贝拉功能\"",
    "build": "echo \"构建生产版本\"",
    "clean": "rmdir /s node_modules"
  }
}
```

## 🚀 生产部署

### 准备生产环境
```bash
# 安装生产依赖
npm install --production

# 启动生产服务器
NODE_ENV=production npm start
```

### 性能优化
- 使用 `pm2` 进程管理器
- 配置反向代理（nginx）
- 启用gzip压缩

## 📊 项目统计

```bash
# 查看依赖树
npm list

# 检查过时的包
npm outdated

# 更新依赖
npm update
```

---

**快速开始：运行 `npm run bella` 即可启动完整的贝拉体验！** 🌸