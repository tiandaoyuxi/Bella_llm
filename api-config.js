// API配置文件
const API_CONFIG = {
    // 默认使用HTTPS
    baseUrl: 'https://localhost:3003/api',
    
    // 如果HTTPS连接失败，可以尝试HTTP
    fallbackUrl: 'http://localhost:3002/api',
    
    // 当前使用的URL
    currentUrl: 'https://localhost:3003/api',
    
    // 切换到HTTP
    useHttp() {
        this.currentUrl = this.fallbackUrl;
        console.log('🔄 切换到HTTP API:', this.currentUrl);
        return this.currentUrl;
    },
    
    // 切换到HTTPS
    useHttps() {
        this.currentUrl = this.baseUrl;
        console.log('🔒 切换到HTTPS API:', this.currentUrl);
        return this.currentUrl;
    },
    
    // 获取完整的API URL
    getUrl(endpoint) {
        return `${this.currentUrl}/${endpoint}`;
    }
};

export default API_CONFIG;