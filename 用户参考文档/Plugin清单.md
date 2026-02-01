# VCP Plugin 清单

本文档提供 **Plugin 完整列表与状态**（已加载 / 已禁用 / 已废弃）。toollist 占位符 `{{VCPXXX}}` 与推荐分类（通用常用 / 可选 / 生图 / 专业）见 [工具列表说明.md](./工具列表说明.md)。**Plugin_Deprecated/** 不参与加载，仅作归档。

---

## 一、加载规则简述

- **扫描范围**：仅 `Plugin/`，只读取 `plugin-manifest.json`（不读 `.block`）。
- **加载条件**：`manifest.name`、`pluginType`、`entryPoint` 三者齐全；同名 `name` 时后者被跳过。
- **状态**：在用 / 可选 / 静态·服务 / 已禁用 / 已废弃。

---

## 二、Plugin 总表（已加载）

| 目录名 | manifest name | pluginType | 状态 | 简要说明 |
|--------|---------------|------------|------|----------|
| AgentAssistant | AgentAssistant | hybridservice | 在用 | Agent 协作/联络其他 Agent |
| AgentMessage | AgentMessage | synchronous | 在用 | 向用户设备推送消息 |
| ArxivDailyPapers | ArxivDailyPapers | static | 静态·服务 | Arxiv 每日论文 |
| BilibiliFetch | BilibiliFetch | synchronous | 可选 | B 站视频/直播内容获取 |
| CapturePreprocessor | CapturePreprocessor | messagePreprocessor | 静态·服务 | 捕获预处理器 |
| ChromeBridge | ChromeBridge | hybridservice | 可选 | Chrome 浏览器桥接 |
| CodeSearcher | ServerCodeSearcher | synchronous | 可选 | 代码搜索（Rust） |
| CrossRefDailyPapers | CrossRefDailyPapers | static | 静态·服务 | CrossRef 每日论文 |
| DailyNote | DailyNote | synchronous | 在用 | 日记创建/更新/检索 |
| DailyNoteGet | DailyNoteGet | static | 静态·服务 | 日记内容获取（占位符注入） |
| DailyNotePanel | DailyNotePanelRouter | service | 静态·服务 | 日记面板路由与 API |
| DailyHot | DailyHot | static | 静态·服务 | 每日热榜 |
| DeepWikiVCP | DeepWikiVCP | synchronous | 可选 | DeepWiki 抓取 |
| EmojiListGenerator | EmojiListGenerator | static | 静态·服务 | 表情包列表生成 |
| FileListGenerator | FileListGenerator | static | 静态·服务 | 文件列表生成 |
| FileOperator | ServerFileOperator | synchronous | 在用 | 文件读写、列表、编辑 |
| FileServer | FileServer | service | 静态·服务 | 文件服务 |
| FileTreeGenerator | FileTreeGenerator | static | 静态·服务 | 文件树生成 |
| FRPSInfoProvider | FRPSInfoProvider | static | 静态·服务 | FRPS 设备信息 |
| ImageProcessor | ImageProcessor | messagePreprocessor | 静态·服务 | 多模态数据提取 |
| ImageServer | ImageServer | service | 静态·服务 | 图床服务 |
| KolorsGen | KolorsGen | synchronous | 在用 | 免费文生图（Kolors） |
| PowerShellExecutor | ServerPowerShellExecutor | synchronous | 可选 | PowerShell 执行 |
| ProjectAnalyst | ProjectAnalyst | synchronous | 可选 | 项目分析 |
| PyCameraCapture | PyCameraCapture | synchronous | 可选 | Python 摄像头 |
| PyScreenshot | PyScreenshot | synchronous | 可选 | Python 截图 |
| RAGDiaryPlugin | RAGDiaryPlugin | hybridservice | 在用 | RAG 日记本检索（占位符） |
| Randomness | Randomness | synchronous | 在用 | 掷骰、抽牌、随机数 |
| ScheduleBriefing | ScheduleBriefing | static | 静态·服务 | 用户日程简报 |
| ScheduleManager | ScheduleManager | synchronous | 可选 | 日程管理 |
| SciCalculator | SciCalculator | synchronous | 在用 | 科学计算器 |
| SemanticGroupEditor | SemanticGroupEditor | synchronous | 可选 | 语义组编辑 |
| SunoGen | SunoGen | synchronous | 可选 | Suno 音乐生成 |
| SynapsePusher | SynapsePusher | service | 静态·服务 | 日志 Synapse 推送 |
| TarotDivination | TarotDivination | synchronous | 可选 | 塔罗占卜 |
| TavilySearch | TavilySearch | synchronous | 在用 | Tavily 联网搜索 |
| ThoughtClusterManager | ThoughtClusterManager | synchronous | 可选 | 思维簇管理 |
| UrlFetch | UrlFetch | synchronous | 在用 | 网页内容抓取 |
| UserAuth | UserAuth | static | 静态·服务 | 用户认证 |
| VCPEverything | ServerSearchController | synchronous | 可选 | 本地文件秒搜 |
| VCPForum | VCPForum | synchronous | 可选 | VCP 论坛发帖/回帖 |
| VCPForumLister | ForumLister | static | 静态·服务 | 论坛帖子列表 |
| VCPLog | VCPLog | service | 静态·服务 | 日志推送 |
| VCPTavern | VCPTavern | hybridservice | 静态·服务 | 上下文注入器 |
| VSearch | VSearch | synchronous | 在用 | VCP 自研语义搜索 |
| WeatherInfoNow | WeatherInfoNow | static | 静态·服务 | 实时天气简报 |
| WeatherReporter | WeatherReporter | static | 静态·服务 | 天气预报员 |
| WebUIGen | WebUIGen | synchronous | 可选 | WebUI 云算力生图 |
| WorkspaceInjector | WorkspaceInjector | messagePreprocessor | 静态·服务 | 工作区动态注入 |

---

## 三、已禁用（不加载）

以下目录下**仅有** `plugin-manifest.json.block`，无 `plugin-manifest.json`，因此不会被加载：

| 目录 | 说明 |
|------|------|
| 1PanelInfoProvider | 静态：1Panel 服务器状态注入 |
| AnimeFinder | 以图找番 |
| ArtistMatcher | 画师匹配查询 |
| ComfyUIGen | ComfyUI 生图 |
| DailyNoteManager | 批量整理日记（如合并、优化结构） |
| DMXDoubaoGen | 豆包生图（DMX 版） |
| DoubaoGen | 豆包文生图 |
| FlashDeepSearch | 闪电深度研究 |
| GeminiImageGen | Gemini 图像生成与编辑 |
| GoogleSearch | 谷歌搜索（API） |
| GrokVideo | Grok 视频生成 |
| IMAPIndex | 静态：邮件索引 |
| IMAPSearch | 同步：邮件全文搜索（依赖 IMAPIndex） |
| KarakeepSearch | Karakeep 书签搜索 |
| KEGGSearch | KEGG 数据库 |
| LightMemo | 轻量回忆/检索 |
| LinuxLogMonitor | Linux 日志监控 |
| LinuxShellExecutor | Linux Shell 执行 |
| MagiAgent | Magi 三贤者会议 |
| MCPO | MCP 相关 |
| MCPOMonitor | MCP 监控 |
| MIDITranslator | MIDI 翻译 |
| NanoBananaGen2 | NanoBanana 生图（官方） |
| NanoBananaGenOR | NanoBanana（OpenRouter） |
| NCBIDatasets | NCBI Datasets |
| NovelAIGen | NovelAI 生图 |
| PubMedSearch | PubMed 文献检索 |
| SerpSearch | Serp API 搜索 |
| TencentCOSBackup | 腾讯云 COS 备份 |
| TimelineGenerator | 时间线生成 |
| VCPForumAssistant | 论坛助手 |
| ZImageGen | Z-Image（阿里通义） |
| ZImageGen2 | Z-Image Base |

---

## 四、已废弃（Plugin_Deprecated）

以下插件已移入 `Plugin_Deprecated/`，不参与扫描与加载：

| 插件名 | 原路径 | 说明 |
|--------|--------|------|
| DailyNoteWrite | Plugin/DailyNoteWrite | 响应块落盘与自动打标已移除，改由 DailyNote 工具 + Agent 打标 |
| FluxGen | Plugin/FluxGen | FLUX.1-dev 生图，已付费/下架 |
| QwenImageGen | Plugin/QwenImageGen | Qwen-Image 生图/编辑，已付费/下架 |
| VideoGenerator (Wan2.1VideoGen) | Plugin/VideoGenerator | Wan2.1 文生视频，已付费/下架 |

详见 [Plugin_Deprecated/README.md](../Plugin_Deprecated/README.md)。

---

## 五、重复 manifest 名称（已禁用）

- **DoubaoGen**：目录 `DoubaoGen` 与 `DMXDoubaoGen` 的 manifest 均使用 `"name": "DoubaoGen"`。二者已一并禁用；若需恢复豆包生图，可只恢复其一并将 manifest 改名为 `plugin-manifest.json`。

---

## 六、过时判定标准（参考）

1. **非工具调用且无其他调用方**：仅由服务端/路由里 `executePlugin("XXX")` 调用的插件（当前除已废弃的 DailyNoteWrite 外无此类用法）。
2. **被完全替代**：功能被另一插件覆盖且文档已推荐替代者（如 DailyNoteWrite → DailyNote）。
3. **重复/冗余**：同一能力多份实现且 manifest 名冲突（如 DMXDoubaoGen vs DoubaoGen）。
4. **仅 .block 存在**：已不加载；若希望仓库更干净可移入 Plugin_Deprecated（可选）。
5. **作者/社区明确废弃**：如「仅 Agent 调用的 DailyNote 工具打 Tag 为唯一真相」原则下的 DailyNoteWrite。

---

*toollist 占位符与推荐分类以 [工具列表说明.md](./工具列表说明.md) 为准；已废弃/已禁用明细以本文为准。*
