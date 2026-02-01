# KolorsGen 插件（Kwai-Kolors/Kolors 免费生图）

通过 SiliconFlow API 使用 **Kwai-Kolors/Kolors** 模型进行文生图，该模型在硅基流动上为免费可用。

## 配置

- 在项目根目录 `config.env` 或本插件目录下 `config.env` 中配置：
  - `SILICONFLOW_API_KEY`：硅基流动 API Key（https://siliconflow.cn/）
- 依赖与主项目相同的 `PROJECT_BASE_PATH`、`SERVER_PORT`、`IMAGESERVER_IMAGE_KEY`、`VarHttpUrl`（由 VCP 注入）。

## 调用格式

```
<<<[TOOL_REQUEST]>>>
tool_name:「始」KolorsGen「末」,
prompt:「始」你的提示词「末」,
resolution:「始」1024x1024「末」
<<<[END_TOOL_REQUEST]>>>
```

分辨率可选：`1024x1024`、`960x1280`、`768x1024`、`720x1440`、`720x1280`。可选参数：`seed:「始」整数「末」`。

## 安装依赖

在 `Plugin/KolorsGen` 目录下执行：

```bash
npm install
```
