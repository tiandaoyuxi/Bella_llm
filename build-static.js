const fs = require('fs');
const path = require('path');

// 创建构建目录
const buildDir = './dist';
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// 复制静态文件
const staticFiles = [
    'index.html',
    'style.css',
    'script.js',
    'package.json'
];

staticFiles.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(buildDir, file));
        console.log(`✅ 复制文件: ${file}`);
    }
});

// 复制资源文件夹
const resourceDirs = ['Bellaicon', '视频资源'];
resourceDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDir(dir, path.join(buildDir, dir));
        console.log(`✅ 复制目录: ${dir}`);
    }
});

// 创建配置文件
const config = {
    apiBaseUrl: 'http://localhost:3002', // 可以修改为实际的API地址
    version: '1.0.0',
    buildTime: new Date().toISOString()
};

fs.writeFileSync(
    path.join(buildDir, 'config.json'), 
    JSON.stringify(config, null, 2)
);

// 创建web.config for IIS
const webConfig = `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".webp" mimeType="image/webp" />
      <mimeMap fileExtension=".mp4" mimeType="video/mp4" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
    <httpErrors errorMode="Custom" defaultResponseMode="ExecuteURL">
      <error statusCode="404" responseMode="ExecuteURL" path="/index.html" />
    </httpErrors>
  </system.webServer>
</configuration>`;

fs.writeFileSync(path.join(buildDir, 'web.config'), webConfig);

console.log('🎉 静态文件构建完成！');
console.log('📁 构建目录:', buildDir);
console.log('🌐 可以部署到任何Web服务器');

// 辅助函数：递归复制目录
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}