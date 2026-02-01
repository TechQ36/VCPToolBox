# 废弃插件目录 (Plugin_Deprecated)

本目录存放已废弃的插件备份。原因包括：依赖的模型已付费/下架、功能由其他插件或服务内联替代、或作者/社区明确废弃。**Plugin_Deprecated/** 不参与 Plugin 扫描，移入即视为废弃。

## 已废弃插件列表

| 插件名 | 原路径 | 说明 |
|--------|--------|------|
| DailyNoteWrite | Plugin/DailyNoteWrite | 响应块落盘与自动打标已移除；原则：仅 Agent 调用的 DailyNote 工具打 Tag 为唯一真相 |
| FluxGen | Plugin/FluxGen | FLUX.1-dev / kaiwei-flux-kontext 生图，已付费 |
| QwenImageGen | Plugin/QwenImageGen | Qwen-Image / Qwen-Image-Edit 生图/编辑，已付费 |
| VideoGenerator (Wan2.1VideoGen) | Plugin/VideoGenerator | Wan2.1 文生视频/图生视频，已付费 |

上述插件在 `Plugin/` 下已删除或 manifest 已改为占位（无 entryPoint），服务启动时不会加载。完整代码备份于本目录。若需恢复，可将本目录内对应插件复制回 `Plugin/` 并恢复原 `plugin-manifest.json`。

## 当前可用替代

- **日记/打标**：使用 **DailyNote** 工具（create/update），由回复的 Agent 自行打 Tag。
- **生图**：使用 `Plugin/KolorsGen`（Kwai-Kolors/Kolors，SiliconFlow 免费可用）。
