# SteamAPI WASM 兼容性评估报告

## 项目概述

- **项目名称**: node-steamapi
- **项目版本**: 3.1.3
- **项目描述**: Steam API 的 Node.js 封装库
- **评估日期**: 2025年1月

## 评估结果总结

### 🔴 严重兼容性问题: 5个

### 🟡 中等兼容性问题: 3个

### 🟢 轻微兼容性问题: 2个

---

## 详细问题分析

### 🔴 严重兼容性问题

#### 1. Node.js 内置模块依赖 (关键阻塞)

**问题描述**: 项目使用了多个 Node.js 内置模块，这些模块在 WASM 环境中不可用。

**受影响文件**:

- `src/SteamAPI.ts` - 第1-6行

**具体问题**:

```typescript
import querystring from 'node:querystring';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Package = require('../../package.json');
```

**影响评估**:

- `node:querystring` - 用于URL参数序列化，在每个API调用中都使用
- `node:module` 和 `createRequire` - 用于加载package.json，获取版本信息
- `import.meta.url` - Node.js 特有的元数据，WASM中不支持

**兼容性风险**: ⭐⭐⭐⭐⭐ (最高)

#### 2. steamid 依赖包兼容性

**问题描述**: 项目依赖的 `steamid@2.0.0` 包可能不兼容 WASM 环境。

**受影响文件**:

- `src/SteamAPI.ts` - 第1行
- `package.json` - dependencies

**具体问题**:

```typescript
import SteamID from 'steamid';
// 在 resolve() 方法中大量使用:
const sid = new SteamID(steamID2Match[1]);
return sid.getSteamID64();
```

**使用范围**:

- SteamID2/SteamID3 格式转换
- 用户ID解析和验证
- 在 `resolve()` 方法中频繁调用

**兼容性风险**: ⭐⭐⭐⭐⭐ (最高)

#### 3. node-fetch 依赖兼容性

**问题描述**: 项目依赖的 `node-fetch@3.3.2` 在某些 WASM 环境中可能存在兼容性问题。

**受影响文件**:

- `src/fetch-impl.ts` - 整个文件
- `src/utils.ts` - 网络请求实现

**具体问题**:

```typescript
// 动态导入 node-fetch 作为回退
const nodeFetch = await import('node-fetch');
return nodeFetch.default;
```

**潜在问题**:

- node-fetch 的某些版本在 multipart/form-data 处理上存在 CRLF 兼容性问题
- 动态导入机制在某些 WASM 运行时中可能不稳定
- HTTP Agent 支持可能受限

**兼容性风险**: ⭐⭐⭐⭐ (高)

#### 4. console.warn 全局对象依赖

**问题描述**: 代码中使用了 `console.warn`，部分WASM环境可能不提供完整的console API。

**受影响文件**:

- `src/SteamAPI.ts` - 第201-205行

**具体问题**:

```typescript
console.warn([
    'no key provided',
    'some methods won\'t work', 
    'get one from https://goo.gl/DfNy5s or initialize SteamAPI as new SteamAPI(false) to suppress this warning'
].join('\n'));
```

**兼容性风险**: ⭐⭐⭐⭐ (高)

#### 5. Date.now() 精度和可用性

**问题描述**: 缓存实现中使用 `Date.now()`，某些WASM环境可能不提供高精度时间API。

**受影响文件**:

- `src/Cache.ts` - 第22, 30行

**具体问题**:

```typescript
if (val && val.expiresAt <= Date.now()) {
    // ...
}
expiresAt: Date.now() + this.ttl,
```

**兼容性风险**: ⭐⭐⭐⭐ (高)

### 🟡 中等兼容性问题

#### 6. fetch API 全局对象检测

**问题描述**: 代码假设可以通过 `typeof fetch` 检测全局fetch的可用性。

**受影响文件**:

- `src/fetch-impl.ts` - 第7-11行

**具体问题**:

```typescript
if (typeof fetch !== 'undefined') {
    return fetch;
} else {
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default;
}
```

**潜在影响**: WASM环境中的fetch实现可能与预期行为不一致

**兼容性风险**: ⭐⭐⭐ (中等)

#### 7. ES模块动态导入

**问题描述**: 使用了动态导入语法，某些WASM环境可能不完全支持。

**受影响文件**:

- `src/fetch-impl.ts` - 第10行

**具体问题**:

```typescript
const nodeFetch = await import('node-fetch');
```

**兼容性风险**: ⭐⭐⭐ (中等)

#### 8. 正则表达式复杂性

**问题描述**: 使用了多个复杂的正则表达式，某些WASM JavaScript引擎可能性能不佳。

**受影响文件**:

- `src/SteamAPI.ts` - 第169-175行

**具体问题**:

```typescript
static reProfileBase = String.raw`(?:(?:(?:(?:https?)?:\/\/)?(?:www\.)?steamcommunity\.com)?)?\/?`;
static reCommunityID = RegExp(String.raw`^(\d{17})$`, 'i');
static reSteamID2 = RegExp(String.raw`^(STEAM_\d+:\d+:\d+)$`, 'i');
static reSteamID3 = RegExp(String.raw`^(\[U:\d+:\d+\])$`, 'i');
static reProfileURL = RegExp(String.raw`${this.reProfileBase}profiles\/(\d{17})`, 'i');
static reVanityURL = RegExp(String.raw`${this.reProfileBase}id\/([a-z0-9_-]{2,32})`, 'i');
static reVanityID = RegExp(String.raw`([a-z0-9_-]{2,32})`, 'i');
```

**兼容性风险**: ⭐⭐⭐ (中等)

### 🟢 轻微兼容性问题

#### 9. Map 数据结构使用

**问题描述**: 缓存实现使用了 Map 数据结构，虽然现代WASM环境支持，但在一些受限环境中可能有性能问题。

**受影响文件**:

- `src/Cache.ts` - 第16行

**具体问题**:

```typescript
this.map = new Map<K, CacheValue<V>>();
```

**兼容性风险**: ⭐⭐ (低)

#### 10. HTTP响应错误处理

**问题描述**: 错误处理依赖特定的HTTP响应格式和正则表达式解析。

**受影响文件**:

- `src/utils.ts` - 第4, 14-15行

**具体问题**:

```typescript
const reg = /<h1>(.*)<\/h1>/;
// ...
throw new Error(data.match(reg)?.[1] || data);
```

**兼容性风险**: ⭐⭐ (低)

---

## 依赖包兼容性分析

### 核心依赖

1. **node-fetch@3.3.2**:

   - ❌ 需要替换为WASM兼容的fetch实现
   - 🔄 建议使用原生fetch或特定的WASM fetch polyfill
2. **steamid@2.0.0**:

   - ❓ 需要验证WASM兼容性
   - 🔄 可能需要寻找替代方案或自实现SteamID处理逻辑

### 开发依赖

1. **@types/node@20.11.5**:

   - ❌ WASM环境不需要Node.js类型定义
   - 🔄 需要替换为Web API类型定义
2. **typescript@5.7.3**:

   - ✅ TypeScript编译器本身与目标环境无关

---

## 推荐解决方案

### 直接修复方案 (简单有效)

#### 1. 替换Node.js内置模块依赖

**目标**: 移除所有Node.js特定的内置模块依赖

**具体修改**:

```typescript
// src/SteamAPI.ts - 替换 querystring
// 原代码:
// import querystring from 'node:querystring';

// 修改为:
function encodeParams(params: Record<string, any>): string {
  return new URLSearchParams(params).toString();
}

// 在 get() 方法中使用:
// 原代码: querystring.stringify(params)
// 修改为: encodeParams(params)
```

```typescript
// src/SteamAPI.ts - 移除 package.json 动态导入
// 原代码:
// import { createRequire } from 'node:module';
// const require = createRequire(import.meta.url);
// const Package = require('../../package.json');

// 修改为: 使用构建时注入的版本信息
import { version, name } from './version.js';
const Package = { version, name };
```

```typescript
// src/version.ts - 新建文件，构建时自动生成
export const version = 'UNKNOWN'; // 默认值，构建时替换
export const name = 'steamapi';
```

```json
// package.json - 添加构建脚本
{
  "scripts": {
    "prebuild": "node -e \"const fs = require('fs'); const pkg = require('./package.json'); fs.writeFileSync('./src/version.ts', `export const version = '${pkg.version}';\\nexport const name = '${pkg.name}';`);\"",
    "build": "npm run prebuild && tsc",
    "prepublish": "npm run build"
  }
}
```

#### 2. 简化fetch实现

**目标**: 直接使用全局fetch，去掉node-fetch依赖

**具体修改**:

```typescript
// src/fetch-impl.ts - 完全重写，增强多环境兼容性
export function getFetch(): typeof fetch {
  if (typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  // 检查 Web Worker 环境中的 self.fetch
  if (typeof self !== 'undefined' && typeof (self as any).fetch === 'function') {
    return ((self as any).fetch as typeof fetch).bind(self);
  }
  throw new Error('Fetch API is not available. Please ensure you are in a compatible environment.');
}

// src/utils.ts - 更新使用方式，增强错误处理
import { getFetch } from './fetch-impl.js';

export async function fetch(url: string, options: any): Promise<any> {
  const fetchFn = getFetch();
  const res = await fetchFn(url, options);
  
  if (res.status >= 400) {
    // 优先尝试解析 JSON 错误响应
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorJson = await res.json();
        throw new Error(errorJson.message || res.statusText);
      } catch {
        // JSON 解析失败，继续使用 HTML 解析
      }
    }
  
    // 回退到 HTML 解析
    const text = await res.text();
    const reg = /<h1>(.*?)<\/h1>/; // 使用非贪婪匹配
    const match = text.match(reg);
    throw new Error(match?.[1] || text || res.statusText);
  }

  return res.json();
}
```

#### 3. 改造steamid包为WASM兼容版本

**目标**: 基于[node-steamid源码](https://github.com/DoctorMcKay/node-steamid)改造，保持功能完整性

**可行性分析**: ✅ **高度可行**

- steamid包是零依赖的纯计算库
- 主要是数学运算和字符串处理，无Node.js特定API
- 已支持BigInt，与WASM环境兼容
- 代码量较小，改造成本低

**具体修改策略**:

1. **直接复制核心逻辑**:

```typescript
// src/steamid-wasm.ts - 基于原仓库改造
// 复制 https://github.com/DoctorMcKay/node-steamid 的核心实现
// 移除任何Node.js环境检测代码

export class SteamID {
  // 复制原包的所有枚举定义
  static Universe = {
    INVALID: 0,
    PUBLIC: 1,
    BETA: 2,
    INTERNAL: 3,
    DEV: 4
  };

  static Type = {
    INVALID: 0,
    INDIVIDUAL: 1,
    MULTISEAT: 2,
    GAMESERVER: 3,
    ANON_GAMESERVER: 4,
    PENDING: 5,
    CONTENT_SERVER: 6,
    CLAN: 7,
    CHAT: 8,
    P2P_SUPER_SEEDER: 9,
    ANON_USER: 10
  };

  static Instance = {
    ALL: 0,
    DESKTOP: 1,
    CONSOLE: 2,
    WEB: 4
  };

  // 复制原包的构造函数和核心方法
  // 确保移除任何 process 或 Node.js 特定检查
  
  constructor(input?: string | BigInt) {
    // 基于原实现，确保WASM兼容
  }

  getSteamID64(): string {
    // 复制原始实现
  }

  // ... 其他核心方法
}
```

2. **更新依赖引用**:

```typescript
// src/SteamAPI.ts - 更新import
// 原代码:
// import SteamID from 'steamid';

// 修改为:
import { SteamID } from './steamid-wasm.js';

// 其余代码保持不变，确保API兼容性
```

3. **移除package.json依赖**:

```json
{
  "dependencies": {
    // 移除:
    // "steamid": "^2.0.0"
  }
}
```

**优势**:

- ✅ **保持完整功能**: 相比自实现，功能更完整
- ✅ **API兼容性**: 不需要修改现有调用代码
- ✅ **经过验证**: 基于成熟的生产级代码
- ✅ **维护性好**: 如有bug可参考原仓库修复

#### 4. 添加安全的console处理

**目标**: 确保console API的兼容性

**具体修改**:

```typescript
// src/utils.ts - 添加安全的日志函数
function safeWarn(message: string): void {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(message);
  }
  // WASM环境中可能没有console，静默处理
}

// src/SteamAPI.ts - 更新警告调用
// 原代码:
// console.warn([...].join('\n'));

// 修改为:
import { safeWarn } from './utils.js';
safeWarn([
  'no key provided',
  'some methods won\'t work',
  'get one from https://goo.gl/DfNy5s or initialize SteamAPI as new SteamAPI(false) to suppress this warning'
].join('\n'));
```

#### 5. 确保Date API兼容性

**目标**: 添加Date.now()的兼容性检查

**具体修改**:

```typescript
// src/Cache.ts - 添加安全的时间获取
function getTimestamp(): number {
  if (typeof Date !== 'undefined' && Date.now) {
    return Date.now();
  }
  // 备用方案：使用基本的Date构造
  return new Date().getTime();
}

// 更新缓存实现
get(key: K): V | undefined {
  const val = this.map.get(key);
  if (val && val.expiresAt <= getTimestamp()) {
    this.map.delete(key);
    return;
  }
  return val?.data;
}

set(key: K, value: V): V {
  this.map.set(key, {
    expiresAt: getTimestamp() + this.ttl,
    data: value,
  });
  return value;
}
```

### 依赖项更新

#### package.json 修改

```json
{
  "dependencies": {
    // 移除这些依赖:
    // "node-fetch": "^3.3.2",
    // "steamid": "^2.0.0"
  
    // 无需新增任何依赖
  },
  "devDependencies": {
    // 移除 Node.js 类型定义:
    // "@types/node": "^20.11.5",
    // "@types/steamid": "^2.0.3",
  
    "typedoc": "^0.28.2",
    "typedoc-plugin-markdown": "^4.6.2", 
    "typescript": "^5.7.3"
  },
  "scripts": {
    "prebuild": "node -e \"const fs = require('fs'); const pkg = require('./package.json'); fs.writeFileSync('./src/version.ts', \\`export const version = '${pkg.version}';\\\\nexport const name = '${pkg.name}';\\`);\"",
    "build": "npm run prebuild && tsc",
    "prepublish": "npm run build"
  }
}
```

#### tsconfig.json 修改

```json
{
  "compilerOptions": {
    // ... 其他配置
    "lib": ["ESNext", "DOM"], // 替换Node.js类型，使用Web标准类型
    // ...
  }
}

---

## 测试策略

### 1. 兼容性测试
- 在不同WASM运行时中测试 (Wasmtime, WASI, 浏览器WASM等)
- 功能完整性测试
- 性能基准测试

### 2. 渐进式迁移测试
- 先修复严重问题，逐步解决其他问题
- 为每个修复创建独立的测试用例
- 确保向后兼容性

### 3. 自动化测试
```yaml
# GitHub Actions 示例
- name: Test WASM compatibility
  run: |
    npm run build:wasm
    npm run test:wasm
```

---

## 迁移优先级建议

### 阶段1 - 关键阻塞问题 (优先级: 最高)

1. 替换 `node:querystring` 使用
2. 移除 `node:module` 和 `createRequire` 依赖
3. 处理 package.json 导入问题

### 阶段2 - 核心功能 (优先级: 高)

1. 解决 steamid 包兼容性
2. 修复 node-fetch 相关问题
3. 实现 console API 兼容层

### 阶段3 - 优化和完善 (优先级: 中)

1. 优化缓存实现
2. 改进错误处理
3. 性能优化

### 阶段4 - 测试和文档 (优先级: 中)

1. 完善WASM环境测试
2. 更新文档
3. 示例代码

---

## 预估工作量

### 开发时间预估 (更新)

- **Node.js依赖替换**: 2.5小时 (querystring + 构建时版本注入)
- **SteamID包改造**: 3小时 (复制并适配node-steamid源码)
- **Fetch层简化**: 2.5小时 (增强多环境兼容性和错误处理)
- **兼容性增强**: 1小时 (console, Date API)
- **依赖清理和配置**: 1小时 (package.json, tsconfig.json)
- **WASM测试环境搭建**: 4小时 (Vitest配置 + 单元测试 + 集成测试)
- **兼容性专项测试**: 2小时 (版本注入、环境检测、WASM特定测试)
- **准备工作**: 30分钟 (备份、分支)

**实际总计**: 约16.5小时 (2.1个工作日)

### 风险评估

- **技术风险**: 低 - 主要是直接替换，无需复杂架构变更
- **兼容性风险**: 低 - 保持相同的API接口，只替换底层实现
- **维护风险**: 低 - 减少了外部依赖，降低维护复杂度

---

## 实施步骤

### 具体执行顺序

#### 第1步: 准备工作 (30分钟)

1. 备份当前代码
2. 创建新的分支用于WASM兼容性改造

#### 第2步: 移除Node.js依赖 (2.5小时)

1. 修改 `src/SteamAPI.ts`，移除 `node:querystring` 和 `node:module` 导入
2. 实现 `encodeParams` 函数替换 `querystring.stringify`
3. 创建 `src/version.ts` 文件并设置构建时版本注入
4. 更新 `package.json` 添加 `prebuild` 脚本

#### 第3步: 改造steamid包为WASM兼容版本 (3小时)

1. 从 [node-steamid仓库](https://github.com/DoctorMcKay/node-steamid) 复制核心代码
2. 新建 `src/steamid-wasm.ts` 文件，移除Node.js特定代码
3. 更新 `src/SteamAPI.ts` 中的import路径（无需修改调用代码）

#### 第4步: 重写fetch实现 (2.5小时)

1. 重写 `src/fetch-impl.ts`，移除 node-fetch 依赖，增强多环境兼容性
2. 更新 `src/utils.ts` 中的fetch使用方式，改进错误处理逻辑
3. 测试网络请求功能

#### 第5步: 添加兼容性处理 (1小时)

1. 在 `src/utils.ts` 中添加 `safeWarn` 函数
2. 在 `src/Cache.ts` 中添加 `getTimestamp` 函数
3. 更新相关调用

#### 第6步: 更新依赖配置 (1小时)

1. 修改 `package.json`，移除不需要的依赖，添加Vitest相关依赖
2. 更新 `tsconfig.json`，配置 `lib: ["ESNext", "DOM"]`
3. 验证构建脚本正常工作

#### 第7步: WASM测试环境搭建 (4小时)

1. 创建 `test/wasm/` 目录结构
2. 配置 Vitest (`vitest.config.ts` + `setup.ts`)
3. 编写核心功能单元测试 (SteamAPI、Fetch、SteamID、Utils、Cache)
4. 转换现有集成测试为WASM兼容版本
5. 添加测试脚本到 `package.json`

#### 第8步: 兼容性专项测试 (2小时)

1. 版本注入机制测试
2. 环境检测功能测试
3. WASM特定功能验证测试
4. 执行完整测试套件验证

**总计工作时间: 约16.5小时 (2.1个工作日)**

---

## 补充考虑事项

### 测试环境兼容性

**现状分析**:
当前项目的测试文件 `test/test.mjs` 是为 Node.js 环境编写的集成测试，包含以下特点：

- 使用ES模块导入 (`import SteamAPI from '../dist/index.js'`)
- 依赖外部配置文件 (`import { key } from './cfg.mjs'`)
- 手动执行所有API方法的集成测试
- 覆盖了约30个API方法，包括用户、游戏、服务器等各类接口

**潜在问题**:

1. 现有测试依赖构建后的dist目录，不能直接测试源码
2. 缺乏单元测试，只有集成测试
3. 无法验证WASM环境下的兼容性改动
4. 测试配置通过文件导入，WASM环境可能不支持

**解决方案: 基于Vitest的双环境测试策略**

#### 测试架构设计

```
test/
├── node/                    # Node.js环境测试(保留现有)
│   ├── test.mjs            # 现有集成测试
│   └── cfg.example.mjs     # 配置示例
├── wasm/                   # WASM环境测试(新增)
│   ├── vitest.config.ts    # Vitest配置
│   ├── setup.ts            # 测试环境设置
│   ├── unit/               # 单元测试
│   │   ├── steamapi.test.ts        # SteamAPI核心功能测试
│   │   ├── fetch-impl.test.ts      # Fetch实现测试
│   │   ├── steamid-wasm.test.ts    # SteamID功能测试 
│   │   ├── utils.test.ts           # 工具函数测试
│   │   └── cache.test.ts           # 缓存功能测试
│   ├── integration/        # 集成测试
│   │   ├── api-calls.test.ts       # API调用集成测试
│   │   └── error-handling.test.ts  # 错误处理测试
│   └── compatibility/      # 兼容性专项测试
│       ├── version-injection.test.ts   # 版本注入测试
│       ├── environment-detection.test.ts # 环境检测测试
│       └── wasm-specific.test.ts        # WASM特定功能测试
└── shared/                 # 共享测试工具
    ├── test-data.ts        # 测试数据
    ├── mock-api.ts         # API模拟
    └── test-utils.ts       # 测试工具函数
```

#### 具体实施方案

##### 1. Vitest配置 (`test/wasm/vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // 模拟浏览器环境
    globals: true,
    setupFiles: ['./setup.ts'],
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/**/*.test.ts', 'src/types.ts']
    }
  },
  resolve: {
    alias: {
      '@': '../../src'
    }
  }
});
```

##### 2. 测试环境设置 (`test/wasm/setup.ts`)

```typescript
import { vi } from 'vitest';

// 模拟全局fetch (如果环境中没有)
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

// 设置测试用的Steam API Key
globalThis.__STEAM_API_KEY__ = process.env.STEAM_API_KEY || 'test-key';

// 模拟console.warn以避免测试中的警告信息
globalThis.console.warn = vi.fn();
```

##### 3. 核心功能单元测试

**SteamAPI核心测试** (`test/wasm/unit/steamapi.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SteamAPI from '@/SteamAPI';

describe('SteamAPI Core Functionality', () => {
  let steamAPI: SteamAPI;
  
  beforeEach(() => {
    steamAPI = new SteamAPI('test-key');
  });

  describe('Constructor and Options', () => {
    it('应该使用默认选项初始化', () => {
      expect(steamAPI.language).toBe('english');
      expect(steamAPI.currency).toBe('us');
    });

    it('应该接受自定义选项', () => {
      const customAPI = new SteamAPI('test-key', {
        language: 'chinese',
        currency: 'cn'
      });
      expect(customAPI.language).toBe('chinese');
      expect(customAPI.currency).toBe('cn');
    });

    it('应该在无key时显示警告', () => {
      const warnSpy = vi.spyOn(console, 'warn');
      new SteamAPI();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('URL参数编码 (替换querystring)', () => {
    it('应该正确编码URL参数', () => {
      // 测试新的encodeParams函数
      const params = { 
        key: 'test-key', 
        steamid: '76561198000000000',
        appid: 730 
      };
      const encoded = steamAPI.encodeParams(params);
      expect(encoded).toContain('key=test-key');
      expect(encoded).toContain('steamid=76561198000000000');
      expect(encoded).toContain('appid=730');
    });

    it('应该处理特殊字符', () => {
      const params = { query: 'hello world', symbols: '!@#$%' };
      const encoded = steamAPI.encodeParams(params);
      expect(encoded).toContain('query=hello%20world');
    });
  });

  describe('版本信息注入 (替换package.json导入)', () => {
    it('应该包含正确的版本信息', () => {
      expect(steamAPI.headers['User-Agent']).toMatch(/SteamAPI\/\d+\.\d+\.\d+/);
    });

    it('应该使用构建时注入的版本', () => {
      // 验证version.ts模块正常工作
      expect(steamAPI.headers['User-Agent']).not.toContain('UNKNOWN');
    });
  });
});
```

**Fetch实现测试** (`test/wasm/unit/fetch-impl.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFetch } from '@/fetch-impl';

describe('WASM兼容的Fetch实现', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('环境检测', () => {
    it('应该优先使用globalThis.fetch', () => {
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;
    
      const fetchFn = getFetch();
      expect(fetchFn).toBe(mockFetch);
    });

    it('应该在Web Worker环境中使用self.fetch', () => {
      // 模拟Web Worker环境
      delete (globalThis as any).fetch;
      const mockSelf = { fetch: vi.fn() };
      (globalThis as any).self = mockSelf;
    
      const fetchFn = getFetch();
      expect(fetchFn).toBe(mockSelf.fetch);
    });

    it('应该在无fetch时抛出错误', () => {
      delete (globalThis as any).fetch;
      delete (globalThis as any).self;
    
      expect(() => getFetch()).toThrowError('Fetch API is not available');
    });
  });

  describe('错误处理增强', () => {
    it('应该优先解析JSON错误响应', async () => {
      const mockResponse = {
        status: 400,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ message: 'API Error' })
      };
    
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);
    
      const { fetch: wrappedFetch } = await import('@/utils');
      await expect(wrappedFetch('test-url', {})).rejects.toThrow('API Error');
    });

    it('应该回退到HTML错误解析', async () => {
      const mockResponse = {
        status: 400,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('<h1>Error Message</h1>')
      };
    
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);
    
      const { fetch: wrappedFetch } = await import('@/utils');
      await expect(wrappedFetch('test-url', {})).rejects.toThrow('Error Message');
    });
  });
});
```

**SteamID兼容性测试** (`test/wasm/unit/steamid-wasm.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';
import { SteamID } from '@/steamid-wasm'; // 基于node-steamid改造的版本

describe('SteamID WASM兼容性', () => {
  describe('格式转换', () => {
    const testSteamID64 = '76561198000000000';
    const testSteamID2 = 'STEAM_0:0:20000000';
    const testSteamID3 = '[U:1:40000000]';

    it('应该正确创建SteamID实例', () => {
      const steamID = new SteamID(testSteamID64);
      expect(steamID.getSteamID64()).toBe(testSteamID64);
    });

    it('应该正确转换SteamID2格式', () => {
      const steamID = new SteamID(testSteamID2);
      expect(steamID.getSteamID64()).toBe(testSteamID64);
    });

    it('应该正确转换SteamID3格式', () => {
      const steamID = new SteamID(testSteamID3);
      expect(steamID.getSteamID64()).toBe(testSteamID64);
    });

    it('应该支持BigInt计算 (WASM环境)', () => {
      const steamID = new SteamID(testSteamID64);
      expect(typeof steamID.accountid).toBe('number');
      expect(steamID.universe).toBe(SteamID.Universe.PUBLIC);
    });
  });

  describe('枚举定义', () => {
    it('应该包含完整的Universe枚举', () => {
      expect(SteamID.Universe.INVALID).toBe(0);
      expect(SteamID.Universe.PUBLIC).toBe(1);
    });

    it('应该包含完整的Type枚举', () => {
      expect(SteamID.Type.INDIVIDUAL).toBe(1);
      expect(SteamID.Type.CLAN).toBe(7);
    });
  });
});
```

##### 4. 集成测试转换

**API调用集成测试** (`test/wasm/integration/api-calls.test.ts`)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SteamAPI from '@/SteamAPI';

describe('Steam API 集成测试 (WASM环境)', () => {
  let steamAPI: SteamAPI;
  
  beforeEach(() => {
    // 使用环境变量或默认测试key
    const apiKey = process.env.STEAM_API_KEY || 'test-key';
    steamAPI = new SteamAPI(apiKey);
  
    // 模拟fetch响应
    vi.clearAllMocks();
  });

  describe('用户相关API', () => {
    it('resolve() 应该解析用户ID', async () => {
      const mockResponse = {
        status: 200,
        json: () => Promise.resolve({
          response: { steamid: '76561198000000000', success: 1 }
        })
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await steamAPI.resolve('testuser');
      expect(result).toBe('76561198000000000');
    });

    it('getUserSummary() 应该返回用户摘要', async () => {
      const mockResponse = {
        status: 200,
        json: () => Promise.resolve({
          response: { 
            players: [{ 
              steamid: '76561198000000000',
              personaname: 'Test User'
            }]
          }
        })
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await steamAPI.getUserSummary('76561198000000000');
      expect(result.steamID).toBe('76561198000000000');
      expect(result.nickname).toBe('Test User');
    });
  });

  describe('游戏相关API', () => {
    it('getGameDetails() 应该返回游戏详情', async () => {
      const mockResponse = {
        status: 200,
        json: () => Promise.resolve({
          730: { 
            success: true,
            data: { 
              steam_appid: 730,
              name: 'Counter-Strike 2'
            }
          }
        })
      };
      globalThis.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await steamAPI.getGameDetails(730);
      expect(result.appID).toBe(730);
      expect(result.name).toBe('Counter-Strike 2');
    });
  });
});
```

##### 5. 兼容性专项测试

**版本注入测试** (`test/wasm/compatibility/version-injection.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

describe('版本注入机制测试', () => {
  it('构建脚本应该正确生成version.ts', async () => {
    // 验证version.ts文件存在且格式正确
    const versionModule = await import('@/version');
  
    expect(versionModule.version).toBeDefined();
    expect(versionModule.name).toBe('steamapi');
    expect(versionModule.version).not.toBe('UNKNOWN');
    expect(versionModule.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('User-Agent应该包含正确版本', () => {
    const steamAPI = new SteamAPI('test-key');
    const userAgent = steamAPI.headers['User-Agent'];
  
    expect(userAgent).toMatch(/^SteamAPI\/\d+\.\d+\.\d+ \(https:\/\/www\.npmjs\.com\/package\/steamapi\)$/);
  });
});
```

##### 6. 依赖项配置

**package.json更新**

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "jsdom": "^23.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "typedoc": "^0.28.2",
    "typedoc-plugin-markdown": "^4.6.2", 
    "typescript": "^5.7.3"
  },
  "scripts": {
    "test": "npm run test:node",
    "test:node": "node test/node/test.mjs",
    "test:wasm": "vitest run --config test/wasm/vitest.config.ts",
    "test:wasm:watch": "vitest --config test/wasm/vitest.config.ts",
    "test:coverage": "vitest run --coverage --config test/wasm/vitest.config.ts",
    "test:all": "npm run test:node && npm run test:wasm"
  }
}
```

#### 测试覆盖重点

**必须测试的改动点**:

1. **querystring替换** - `encodeParams`函数的正确性
2. **版本注入** - 构建时版本信息的准确性
3. **Fetch增强** - 多环境兼容性和错误处理
4. **SteamID改造** - 完整功能的兼容性
5. **console/Date兼容** - 安全调用的有效性

**兼容性验证**:

1. **环境检测** - 正确识别WASM/Browser/Worker环境
2. **API调用** - 所有核心API在WASM环境下正常工作
3. **错误处理** - 网络错误、API错误的正确处理
4. **缓存机制** - Map/Date API在WASM中的工作状态
5. **类型安全** - TypeScript类型在WASM构建中的正确性

### 长期维护考虑

#### 版本同步机制

通过构建脚本自动同步 `src/version.ts` 与 `package.json`，避免手动维护带来的版本不一致风险。

#### TypeScript 配置优化

使用 `"lib": ["ESNext", "DOM"]` 替代 `@types/node`，确保类型定义与目标环境一致。

#### 错误处理健壮性

增强fetch错误处理，支持JSON和HTML两种错误响应格式，提高在不同API环境下的兼容性。

---

## 结论

SteamAPI 项目的 WASM 兼容性改造**无需复杂的架构重构**，主要工作集中在：

1. **直接替换Node.js特定API** - 使用Web标准API替换
2. **移除外部依赖** - 自实现核心功能，减少依赖风险
3. **添加基本兼容性检查** - 确保在不同环境中稳定运行

**主要优势**：

- ✅ **实施简单** - 无需创建复杂的抽象层
- ✅ **工作量适中** - 预计2.1个工作日完成核心改造和完整测试
- ✅ **风险可控** - 保持现有API不变，只替换底层实现
- ✅ **维护简化** - 减少外部依赖，降低维护负担
- ✅ **性能提升** - 去掉中间层，直接使用原生API
- ✅ **测试完备** - 双环境测试策略，确保兼容性和质量

这个方案提供了一条简单直接的WASM兼容性改造路径，避免了过度工程化的复杂方案。
