#!/usr/bin/env node
/**
 * BackendImageGen：与 KolorsGen 相同的工具调用方式，但走自有模型 API（config.env 中的 API_URL + 图像模型）。
 * 不依赖硅基流动，直接请求你在「全局基础配置」里配置的后端生图模型。
 */
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const API_URL = (process.env.API_URL || '').replace(/\/$/, '');
const API_Key = process.env.API_Key;
const PROJECT_BASE_PATH = process.env.PROJECT_BASE_PATH;
const SERVER_PORT = process.env.SERVER_PORT;
const IMAGESERVER_IMAGE_KEY = process.env.IMAGESERVER_IMAGE_KEY;
const VAR_HTTP_URL = process.env.VarHttpUrl;

// 自选生图模型：优先用 VarBackendImageModel，否则用 WhitelistImageModel 的第一个
const WHITELIST = (process.env.WhitelistImageModel || '').split(',').map(m => m.trim()).filter(Boolean);
const BACKEND_IMAGE_MODEL = process.env.VarBackendImageModel?.trim() || (WHITELIST.length > 0 ? WHITELIST[0] : null);

const RESOLUTIONS = ['1024x1024', '960x1280', '768x1024', '720x1440', '720x1280'];

function isValidArgs(args) {
    if (!args || typeof args !== 'object') return false;
    if (typeof args.prompt !== 'string' || !args.prompt.trim()) return false;
    if (args.resolution !== undefined && (typeof args.resolution !== 'string' || !RESOLUTIONS.includes(args.resolution))) return false;
    if (args.seed !== undefined && (typeof args.seed !== 'number' || !Number.isInteger(args.seed) || args.seed < 0)) return false;
    return true;
}

/**
 * 从后端 /v1/chat/completions 响应中提取图片（支持 Gemini 风格 candidates + OpenAI 风格 choices）
 */
function extractImageFromResponse(data) {
    // Gemini 风格: candidates[0].content.parts[] -> inlineData 或 inline_data
    const candidates = data.candidates || data.data?.candidates;
    if (candidates?.[0]?.content?.parts) {
        const parts = candidates[0].content.parts;
        const imagePart = parts.find(p => p.inlineData || p.inline_data);
        if (imagePart) {
            const block = imagePart.inlineData || imagePart.inline_data;
            return {
                buffer: Buffer.from(block.data, 'base64'),
                mimeType: block.mimeType || block.mime_type || 'image/png'
            };
        }
        const textPart = parts.find(p => p.text);
        if (textPart) throw new Error(`API 未返回图片，返回文本: ${textPart.text}`);
    }

    // OpenAI 风格: choices[0].message.content 为数组，含 image_url
    const choices = data.choices || data.data?.choices;
    if (choices?.[0]?.message?.content) {
        const content = choices[0].message.content;
        const items = Array.isArray(content) ? content : [{ type: 'text', text: content }];
        const imageItem = items.find(c => c.type === 'image_url' || c.type === 'image');
        if (imageItem) {
            const url = imageItem.image_url?.url || imageItem.image?.url || imageItem.url;
            if (url && url.startsWith('data:image')) {
                const m = url.match(/^data:(image\/\w+);base64,(.*)$/);
                if (m) return { buffer: Buffer.from(m[2], 'base64'), mimeType: m[1] };
                throw new Error('无法解析 data URL 中的图片。');
            }
        }
    }

    throw new Error('无法从 API 响应中解析出图片，请确认后端支持文生图且返回格式为 candidates.parts.inlineData 或 choices.message.content 中的图片。');
}

async function generateImageAndSave(args) {
    if (!API_URL || !API_Key) {
        throw new Error('BackendImageGen: 请在 config.env 中配置 API_URL 和 API_Key（与 VCP 后端为同一套）。');
    }
    if (!BACKEND_IMAGE_MODEL) {
        throw new Error('BackendImageGen: 请在 config.env 中配置 WhitelistImageModel 或 VarBackendImageModel，指定用于生图的模型 ID。');
    }
    if (!PROJECT_BASE_PATH || !SERVER_PORT || !IMAGESERVER_IMAGE_KEY || !VAR_HTTP_URL) {
        throw new Error('BackendImageGen: 缺少 PROJECT_BASE_PATH / SERVER_PORT / IMAGESERVER_IMAGE_KEY / VarHttpUrl，由 VCP 注入。');
    }
    if (!isValidArgs(args)) {
        throw new Error(`BackendImageGen: 参数无效。必需: prompt (字符串)。可选: resolution (${RESOLUTIONS.join(', ')}), seed (非负整数)。`);
    }

    let userContent = args.prompt.trim();
    if (args.resolution) userContent += `\n请输出分辨率为 ${args.resolution} 的图片。`;

    const payload = {
        model: BACKEND_IMAGE_MODEL,
        messages: [{ role: 'user', content: userContent }],
        stream: false,
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            responseMimeType: 'text/plain'
        }
    };
    if (args.seed !== undefined && args.seed >= 0) {
        if (payload.generationConfig) payload.generationConfig.seed = args.seed;
        else payload.generationConfig = { seed: args.seed };
    }

    const response = await axios.post(`${API_URL}/v1/chat/completions`, payload, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_Key}`
        },
        timeout: 120000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        validateStatus: () => true
    });

    if (response.status !== 200) {
        const msg = response.data?.error?.message || response.data?.message || response.statusText;
        throw new Error(`BackendImageGen: API 请求失败 (${response.status}): ${msg}`);
    }

    const { buffer: imageBuffer, mimeType } = extractImageFromResponse(response.data);
    const ext = mimeType.split('/')[1] || 'png';
    const generatedFileName = `${uuidv4()}.${ext}`;
    const imageDir = path.join(PROJECT_BASE_PATH, 'image', 'backendenogen');
    const localImagePath = path.join(imageDir, generatedFileName);

    await fs.mkdir(imageDir, { recursive: true });
    await fs.writeFile(localImagePath, imageBuffer);

    const relativePathForUrl = path.join('backendenogen', generatedFileName).replace(/\\/g, '/');
    const accessibleImageUrl = `${VAR_HTTP_URL}:${SERVER_PORT}/pw=${IMAGESERVER_IMAGE_KEY}/images/${relativePathForUrl}`;
    const base64Image = imageBuffer.toString('base64');

    const result = {
        content: [
            {
                type: 'text',
                text: `图片已成功生成（自有模型 API）！\n- 提示词: ${args.prompt}\n- 模型: ${BACKEND_IMAGE_MODEL}\n- 可访问URL: ${accessibleImageUrl}`
            },
            {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
        ],
        details: {
            serverPath: `image/backendenogen/${generatedFileName}`,
            fileName: generatedFileName,
            prompt: args.prompt,
            resolution: args.resolution,
            model: BACKEND_IMAGE_MODEL,
            imageUrl: accessibleImageUrl
        }
    };
    return result;
}

async function main() {
    let inputChunks = [];
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) inputChunks.push(chunk);
    const inputData = inputChunks.join('');

    try {
        if (!inputData.trim()) {
            console.log(JSON.stringify({ status: 'error', error: 'BackendImageGen: 未收到 stdin 输入。' }));
            process.exit(1);
        }
        const parsedArgs = JSON.parse(inputData);
        const resultObject = await generateImageAndSave(parsedArgs);
        console.log(JSON.stringify({ status: 'success', result: resultObject }));
    } catch (e) {
        const msg = e.message || String(e);
        console.log(JSON.stringify({
            status: 'error',
            error: msg.startsWith('BackendImageGen:') ? msg : `BackendImageGen: ${msg}`
        }));
        process.exit(1);
    }
}

main();
