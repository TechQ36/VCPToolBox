# VCPToolBox 项目参考文档（AI/开发者自用）

> 本文档用于快速理解项目结构、核心流程与关键文件，便于日常开发与排查。  
> 项目：VCP (Variable & Command Protocol) - AI 能力增强与进化中间层。

---

## 一、项目定位与核心概念

| 概念 | 说明 |
|------|------|
| **VCP** | 变量与命令协议，介于前端与 AI 模型 API 之间的中间层，不依赖特定模型的 Function Calling。 |
| **核心三角** | AI 推理引擎 + 外部工具执行（插件）+ 持久化记忆系统（日记/RAG）。 |
| **协议特点** | 基于文本标记的工具调用（`<<<[TOOL_REQUEST]>>>`），对前端零侵入，支持串语法、并行调用、异步射箭等。 |
| **安全警告** | Agent 拥有底层级权限，勿用非官方/镜像 API，以防敏感信息泄露。 |

---

## 二、目录结构速览

```
VCPToolBox/
├── server.js                 # 主入口：Express 服务、路由、鉴权、聊天/工具循环
├── Plugin.js                 # 插件管理器：加载/执行本地与分布式插件
├── WebSocketServer.js        # WebSocket：VCPLog、分布式节点、管理面板、Chrome 控制等
├── FileFetcherServer.js      # 分布式文件拉取：跨节点 file:// 解析与 Base64 回填
├── KnowledgeBaseManager.js   # 知识库/RAG：多索引、TagMemo 浪潮算法、向量检索
├── vcpInfoHandler.js         # VCP 信息接口（/v1/vcpinfo 等）
├── modelRedirectHandler.js   # 模型名重定向（内部名↔对外名）
├── config.env                # 主配置（由 config.env.example 复制）
├── Agent/                    # 角色定义 .txt（可由 AGENT_DIR_PATH 配置）
├── TVStxt/                   # 高级变量/占位符 .txt
├── modules/                  # 核心业务模块
│   ├── chatCompletionHandler.js  # 聊天完成：消息处理、工具解析与执行循环
│   ├── messageProcessor.js      # 系统提示词/占位符替换、RAG 注入
│   ├── contextManager.js        # 上下文构建与管理
│   ├── agentManager.js          # Agent 目录与角色文件解析
│   ├── tvsManager.js            # TVStxt 变量管理
│   ├── roleDivider.js           # 角色分割 <<<[ROLE_DIVIDE_xxx]>>>
│   ├── vcpLoop/
│   │   ├── toolCallParser.js    # 解析 <<<[TOOL_REQUEST]>>> 块
│   │   └── toolExecutor.js      # 调用 PluginManager 执行工具
│   └── handlers/
│       ├── streamHandler.js     # 流式响应处理
│       └── nonStreamHandler.js  # 非流式响应处理
├── routes/
│   ├── adminPanelRoutes.js   # /admin_api 管理接口
│   ├── dailyNotesRoutes.js   # 日记相关 API
│   ├── forumApi.js           # 论坛 API
│   ├── specialModelRouter.js # 白名单模型直通（如图像/嵌入模型）
│   └── taskScheduler.js      # 定时任务
├── Plugin/                   # 插件目录（每个子目录一个插件）
│   └── <PluginName>/
│       ├── plugin-manifest.json  # 类型、入口、指令、配置 schema
│       ├── .env                   # 插件专属配置
│       └── 入口脚本(.js/.py/...)
├── AdminPanel/               # Web 管理面板静态与脚本
├── rust-vexus-lite/          # Rust 向量/知识库底层（VexusIndex）
├── dailynote/                # 知识库根目录（可由 KNOWLEDGEBASE_ROOT_PATH 配置）
└── VectorStore/              # 向量索引与 SQLite（可由 KNOWLEDGEBASE_STORE_PATH 配置）
```

---

## 三、请求与工具调用主流程

1. **入口**  
   - 聊天：`POST /v1/chat/completions` 或 `POST /v1/chatvcp/completions`  
   - 鉴权：Header `Authorization: Bearer <Key>`（`config.env` 中的 `Key`）。

2. **请求处理链（简化）**  
   - `server.js` 收到请求 → 可选 `specialModelRouter` 白名单直通 → Bearer 校验 → 交给 `ChatCompletionHandler`。  
   - `chatCompletionHandler`：  
     - 用 `messageProcessor` 做系统提示词、占位符、RAG（如 `[[xx日记本::Time::Group::TagMemo]]`）替换。  
     - 调用后端 AI API（流式或非流式）。  
     - 从 AI 回复中解析 `<<<[TOOL_REQUEST]>>> ... <<<[END_TOOL_REQUEST]>>>`。  
     - `ToolCallParser` 解析出 `tool_name` 与参数（`key:「始」value「末」`）。  
     - `ToolExecutor` 通过 `PluginManager` 执行对应插件（本地或经 WebSocket 转发到分布式节点）。  
     - 将工具结果写回上下文，再次调用 AI，循环直到无工具调用或达到 `MaxVCPLoopStream`/`MaxVCPLoopNonStream`。

3. **插件执行**  
   - 本地：`Plugin.js` 根据 `plugin-manifest.json` 的 `entryPoint` 起子进程（stdio 等），传入 JSON 参数，收 stdout 结果。  
   - 分布式：`WebSocketServer` 将带 `isDistributed: true` 的调用转发到对应节点，收结果后返回给 `PluginManager`。

4. **异步插件**  
   - 插件先返回 `requestId`，完成后 POST `CALLBACK_BASE_URL/plugin-callback/:pluginName/:taskId` 回调。

---

## 四、核心配置文件：config.env

| 类别 | 常用变量 | 说明 |
|------|----------|------|
| API | `API_Key`, `API_URL` | 后端 AI 服务 |
| 服务 | `PORT`, `Key`, `VCP_Key`, `Image_Key`, `File_Key` | 端口与鉴权 |
| 时区 | `DEFAULT_TIMEZONE` | 如 Asia/Shanghai |
| 循环 | `MaxVCPLoopStream`, `MaxVCPLoopNonStream`, `VCPToolCode` | 工具循环次数与验证码 |
| 角色分割 | `EnableRoleDivider`, `RoleDividerSystem` 等 | `<<<[ROLE_DIVIDE_xxx]>>>` 行为 |
| 调试 | `DebugMode`, `ShowVCP` | 调试与是否在回复中展示 VCP 输出 |
| 管理 | `AdminUsername`, `AdminPassword` | Web 管理面板登录 |
| 回调 | `CALLBACK_BASE_URL` | 异步插件回调根地址 |
| 知识库 | `KNOWLEDGEBASE_ROOT_PATH`, `KNOWLEDGEBASE_STORE_PATH`, `VECTORDB_DIMENSION` 等 | 日记路径、向量存储、维度 |
| Agent | `AGENT_DIR_PATH` | Agent 目录，默认 `./Agent` |

---

## 五、插件体系速览

- **类型**：`static` | `messagePreprocessor` | `synchronous` | `asynchronous` | `service` | `hybridservice`  
- **清单**：`Plugin/<Name>/plugin-manifest.json`  
  - `pluginType`, `entryPoint`（如 `command`）, `communication`（如 stdio）, `configSchema`  
  - 同步/异步：`capabilities.invocationCommands`（command/description/example）  
  - 静态：`systemPromptPlaceholders`  
- **配置**：全局 `config.env` + 插件目录下 `.env`，由 `_getPluginConfig` 合并。  
- **工具调用协议**：  
  - 单次：`tool_name:「始」PluginName「末」`, `param1:「始」value1「末」`  
  - 串语法：同一 `<<<[TOOL_REQUEST]>>>` 内多组 command/param 实现多步调用。  
- **高级控制**：`archery:「始」no_reply「末」` 异步不等待；`ink:「始」mark_history「末」` 强制写回历史。

---

## 六、记忆与 RAG（KnowledgeBaseManager）

- **数据**：日记文件（如 `dailynote/`）→ 分块 → 向量化 → 存 SQLite + USearch（Rust Vexus-Lite）。  
- **检索**：TagMemo “浪潮”算法（EPA、残差金字塔、核心标签、偏振语义等），详见 `TagMemo_Wave_Algorithm_Deep_Dive.md`。  
- **语法**：系统提示词中 `[[日记本名::Time::Group::TagMemo]]` 等，由 `messageProcessor` 等解析并替换为检索结果。  
- **热参数**：`rag_params.json` 等，管理面板可调。

---

## 七、WebSocket 路径（WebSocketServer.js）

| 路径模式 | 用途 |
|----------|------|
| `/VCPlog/VCP_Key=xxx` | 前端 VCP 日志流 |
| `/vcpinfo/VCP_Key=xxx` | VCP 信息通道 |
| `/vcp-distributed-server/VCP_Key=xxx` | 分布式节点注册与工具执行 |
| `/vcp-chrome-control/VCP_Key=xxx` | Chrome 控制 |
| `/vcp-admin-panel/VCP_Key=xxx` | 管理面板实时通信 |

---

## 八、主要 HTTP 路由（server.js）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/v1/models` | 模型列表（可经 modelRedirectHandler 重写） |
| POST | `/v1/chat/completions` | 标准聊天（含 VCP 工具循环） |
| POST | `/v1/chatvcp/completions` | VCP 专用聊天入口 |
| POST | `/v1/human/tool` | 人工发起工具调用 |
| POST | `/v1/schedule_task` | 定时任务 |
| POST | `/v1/interrupt` | 中断请求 |
| POST | `/plugin-callback/:pluginName/:taskId` | 异步插件回调 |
| - | `/AdminPanel/*` | 管理面板静态（需 adminAuth） |
| - | `/admin_api/*` | 管理 API（adminPanelRoutes、forum 等） |

白名单由 `specialModelRouter` 处理（如图像/嵌入模型直连后端）。

---

## 九、常用开发与排查要点

1. **改配置**：改 `config.env` 后需重启 `node server.js`（或 PM2）。  
2. **加插件**：在 `Plugin/` 下新建目录并写好 `plugin-manifest.json` 与入口，重启后自动加载。  
3. **工具不执行**：查 AI 是否输出正确 `<<<[TOOL_REQUEST]>>>`、`tool_name` 是否与插件名一致、PluginManager 是否加载该插件、分布式时节点是否注册。  
4. **RAG 不生效**：查 `KNOWLEDGEBASE_*`、`VECTORDB_DIMENSION`、日记路径与权限、是否已索引（可看管理面板或日志）。  
5. **日志**：`DebugMode=true` 可打详细日志；日志模块在 `modules/logger.js`。  
6. **依赖**：Node 主依赖见 `package.json`；Python 插件见各插件下 `requirements.txt`；Rust 见 `rust-vexus-lite`。

---

## 十、相关文档索引

- 用户与愿景：`README.md`  
- 协议与哲学：`VCP.md`  
- 日记系统：`dailynote.md`  
- TagMemo 浪潮算法：`TagMemo_Wave_Algorithm_Deep_Dive.md`  
- 配置示例：`config.env.example`  
- 插件开发：README 中“开发者指南”、`dailynote/VCP开发/` 下手册与指令集  

---

*文档版本：基于当前仓库结构整理，随项目迭代可酌情增删。*
