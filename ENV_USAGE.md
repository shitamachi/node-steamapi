# 环境变量使用指南

node-steamapi 库现在支持从环境变量自动读取 Steam API 密钥，这使得在不同环境（Node.js、浏览器、WebAssembly）中使用更加方便。

## 功能特性

- ✅ **自动环境变量读取**：从 `STEAM_API_KEY` 环境变量读取 API 密钥
- ✅ **多环境兼容**：支持 Node.js、浏览器、WebAssembly 环境
- ✅ **灵活配置**：支持手动提供环境变量配置
- ✅ **向后兼容**：不影响现有代码使用方式

## 使用方法

### 1. Node.js 环境

#### 方法一：设置环境变量
```bash
# 在命令行中设置
export STEAM_API_KEY=your_steam_api_key_here

# 或者在 .env 文件中设置
echo "STEAM_API_KEY=your_steam_api_key_here" > .env
```

```javascript
import SteamAPI from 'steamapi';

// 自动从环境变量读取 API 密钥
const steam = new SteamAPI();

// 使用 API
const user = await steam.getUserSummary('76561198006409530');
```

#### 方法二：使用 .env 文件
```javascript
import SteamAPI, { loadEnvFromFile } from 'steamapi';

// 从 .env 文件加载环境变量
const envConfig = await loadEnvFromFile('.env');
const steam = new SteamAPI(undefined, { envConfig });
```

### 2. 浏览器/WebAssembly 环境

```javascript
import SteamAPI from 'steamapi';

// 手动提供环境配置
const steam = new SteamAPI(undefined, {
  envConfig: {
    STEAM_API_KEY: 'your_steam_api_key_here'
  }
});
```

### 3. 解析 .env 文件内容

```javascript
import { parseEnvContent, loadEnvFromContent } from 'steamapi';

// .env 文件内容
const envFileContent = `
# Steam API Configuration
STEAM_API_KEY=your_steam_api_key_here
NODE_ENV=production
DEBUG=false
`;

// 解析环境变量
const envConfig = parseEnvContent(envFileContent);
console.log(envConfig.STEAM_API_KEY); // 'your_steam_api_key_here'

// 创建 API 实例
const steam = new SteamAPI(undefined, { envConfig });
```

## API 参考

### 构造函数

```typescript
new SteamAPI(key?: string | false, options?: SteamAPIOptions)
```

- `key`：API 密钥
  - `string`：显式提供 API 密钥
  - `false`：禁用 API 密钥（不会尝试读取环境变量）
  - `undefined`：尝试从环境变量读取

- `options.envConfig`：环境变量配置对象

### 环境变量工具函数

#### `parseEnvContent(content: string): EnvConfig`
解析 .env 文件内容为环境变量对象。

```javascript
const config = parseEnvContent(`
STEAM_API_KEY=abc123
NODE_ENV=development
`);
// { STEAM_API_KEY: 'abc123', NODE_ENV: 'development' }
```

#### `getSteamApiKey(envConfig?: EnvConfig): string | undefined`
获取 Steam API 密钥。

```javascript
// 从 process.env 读取
const key1 = getSteamApiKey();

// 从提供的配置读取
const key2 = getSteamApiKey({ STEAM_API_KEY: 'custom_key' });
```

#### `loadEnvConfig(envConfig?: EnvConfig): EnvConfig`
加载完整的环境变量配置。

```javascript
const config = loadEnvConfig({ STEAM_API_KEY: 'override' });
```

#### `loadEnvFromFile(filePath?: string): Promise<EnvConfig>` (仅 Node.js)
从文件加载环境变量。

```javascript
const config = await loadEnvFromFile('.env');
```

#### `loadEnvFromContent(content: string): EnvConfig`
从字符串内容加载环境变量。

```javascript
const config = loadEnvFromContent('STEAM_API_KEY=test123');
```

## .env 文件格式

支持标准的 .env 文件格式：

```bash
# 注释
STEAM_API_KEY=your_api_key_here

# 带引号的值
APP_NAME="Steam API Application"
MESSAGE='Hello World'

# 包含特殊字符的值
CONNECTION_STRING="postgresql://user:pass@host:5432/db"

# 布尔值
DEBUG=true
ENABLE_CACHE=false

# 数字
PORT=3000
TIMEOUT=5000
```

## 优先级顺序

API 密钥的读取优先级：

1. **显式提供的密钥**：`new SteamAPI('explicit_key')`
2. **envConfig 中的 STEAM_API_KEY**：`new SteamAPI(undefined, { envConfig: { STEAM_API_KEY: 'config_key' } })`
3. **process.env.STEAM_API_KEY**：Node.js 环境变量
4. **警告并使用空密钥**：如果以上都没有找到

## 错误处理

```javascript
import SteamAPI from 'steamapi';

try {
  // 如果没有找到 API 密钥，会在控制台输出警告
  const steam = new SteamAPI();
  
  // 某些 API 方法需要密钥，会抛出错误
  const user = await steam.getUserSummary('76561198006409530');
} catch (error) {
  console.error('API 调用失败:', error.message);
}

// 禁用警告
const steamNoKey = new SteamAPI(false);
```

## 使用示例

### 完整的 Node.js 示例

```javascript
// app.js
import SteamAPI from 'steamapi';

// 从环境变量自动读取 API 密钥
const steam = new SteamAPI();

async function getUserInfo(steamId) {
  try {
    const user = await steam.getUserSummary(steamId);
    const games = await steam.getUserOwnedGames(steamId);
    
    return {
      profile: user,
      gameCount: games.length
    };
  } catch (error) {
    console.error('获取用户信息失败:', error.message);
    throw error;
  }
}

// 使用
getUserInfo('76561198006409530').then(console.log);
```

### WebAssembly 环境示例

```javascript
// wasm-app.js
import SteamAPI from 'steamapi';

// WASM 环境中手动提供配置
const steam = new SteamAPI(undefined, {
  envConfig: {
    STEAM_API_KEY: getApiKeyFromSecureStorage(), // 从安全存储获取
  }
});

function getApiKeyFromSecureStorage() {
  // 实现从安全存储获取 API 密钥的逻辑
  return localStorage.getItem('STEAM_API_KEY');
}
```

## 安全注意事项

1. **不要在客户端代码中硬编码 API 密钥**
2. **使用环境变量或安全存储**
3. **在生产环境中保护 .env 文件**
4. **定期轮换 API 密钥**

## 迁移指南

### 从旧版本升级

```javascript
// 旧的使用方式（仍然支持）
const steam = new SteamAPI('your_api_key');

// 新的使用方式（推荐）
// 1. 设置环境变量 STEAM_API_KEY=your_api_key
// 2. 使用自动读取
const steam = new SteamAPI();
```

这种方式更安全、更灵活，特别适合在不同环境中部署应用程序。 