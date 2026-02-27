# BackendImageGen 插件（自选模型生图 · 自有 API）

与 **KolorsGen** 相同的工具调用方式（`tool_name: BackendImageGen`，`prompt`、可选 `resolution`/`seed`），但**不走硅基流动**，而是走你在 **config.env** 里配置的 **API_URL + 图像模型**，即自有模型 API 生图。

## 配置

- **API_URL、API_Key**：使用根目录 `config.env` 中与 VCP 后端相同的那一套，无需在插件目录单独配置。
- **生图模型**（二选一）：
  1. 在根目录 `config.env` 中配置 **WhitelistImageModel**（可多个，逗号分隔），插件会使用**第一个**作为生图模型；
  2. 或在插件目录 `config.env` / 全局基础配置中配置 **VarBackendImageModel**，指定一个模型 ID，则优先使用该模型。

在管理后台 **全局基础配置 (config.env)** 里设置好 `WhitelistImageModel` 或 `VarBackendImageModel` 后，保存并重启 VCP，即可通过工具调用使用该模型生图。

## 调用格式（与 KolorsGen 类似）

```
<<<[TOOL_REQUEST]>>>
tool_name:「始」BackendImageGen「末」,
prompt:「始」一只橘猫在阳光下打盹「末」,
resolution:「始」1024x1024「末」
<<<[END_TOOL_REQUEST]>>>
```

- **prompt**（必需）：生图提示词。
- **resolution**（可选）：`1024x1024`、`960x1280`、`768x1024`、`720x1440`、`720x1280`。
- **seed**（可选）：整数种子。

## 后端要求

- 后端需提供 **OpenAI 兼容** 的 `POST /v1/chat/completions`，且支持**文生图**（返回中带图片）。
- 请求会带上 `generationConfig.responseModalities: ["TEXT", "IMAGE"]`，响应需包含图片数据（例如 Gemini 的 `candidates[].content.parts[].inlineData`，或 OpenAI 风格的 `choices[].message.content` 中的 `image_url`）。

## 输出

与 KolorsGen 一致：返回文本说明 + 可访问图片 URL + base64 图片，便于前端用 `<img>` 展示。
