#!/usr/bin/env node
import axios from "axios";
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration (from environment variables set by Plugin.js) ---
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY;
const PROJECT_BASE_PATH = process.env.PROJECT_BASE_PATH;
const SERVER_PORT = process.env.SERVER_PORT;
const IMAGESERVER_IMAGE_KEY = process.env.IMAGESERVER_IMAGE_KEY;
const VAR_HTTP_URL = process.env.VarHttpUrl;

// SiliconFlow API - Kwai-Kolors/Kolors 免费生图模型
const KOLORS_API_CONFIG = {
    BASE_URL: 'https://api.siliconflow.cn',
    ENDPOINTS: {
        IMAGE_GENERATION: '/v1/images/generations'
    },
    MODEL_ID: "Kwai-Kolors/Kolors",
    DEFAULT_PARAMS: {
        batch_size: 1
    }
};

const RESOLUTIONS = ["1024x1024", "960x1280", "768x1024", "720x1440", "720x1280"];

function isValidKolorsArgs(args) {
    if (!args || typeof args !== 'object') return false;
    if (typeof args.prompt !== 'string' || !args.prompt.trim()) return false;
    if (typeof args.resolution !== 'string' || !RESOLUTIONS.includes(args.resolution)) return false;
    if (args.seed !== undefined && (typeof args.seed !== 'number' || !Number.isInteger(args.seed) || args.seed < 0)) return false;
    return true;
}

async function generateImageAndSave(args) {
    if (!SILICONFLOW_API_KEY) {
        throw new Error("KolorsGen Plugin Error: SILICONFLOW_API_KEY environment variable is required and not set.");
    }
    if (!PROJECT_BASE_PATH) {
        throw new Error("KolorsGen Plugin Error: PROJECT_BASE_PATH environment variable is required for saving images.");
    }
    if (!SERVER_PORT) {
        throw new Error("KolorsGen Plugin Error: SERVER_PORT environment variable is required for constructing image URL.");
    }
    if (!IMAGESERVER_IMAGE_KEY) {
        throw new Error("KolorsGen Plugin Error: IMAGESERVER_IMAGE_KEY environment variable is required for constructing image URL.");
    }
    if (!VAR_HTTP_URL) {
        throw new Error("KolorsGen Plugin Error: VarHttpUrl environment variable is required for constructing image URL.");
    }

    if (!isValidKolorsArgs(args)) {
        throw new Error(`KolorsGen Plugin Error: Invalid arguments. Required: prompt (string), resolution (one of: ${RESOLUTIONS.join(', ')}). Optional: seed (integer).`);
    }

    const client = axios.create({
        baseURL: KOLORS_API_CONFIG.BASE_URL,
        headers: {
            'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
            'Content-Type': 'application/json'
        },
        timeout: 60000
    });

    const payload = {
        model: KOLORS_API_CONFIG.MODEL_ID,
        prompt: args.prompt,
        image_size: args.resolution,
        batch_size: KOLORS_API_CONFIG.DEFAULT_PARAMS.batch_size
    };
    if (args.seed !== undefined) {
        payload.seed = args.seed;
    }

    const response = await client.post(
        KOLORS_API_CONFIG.ENDPOINTS.IMAGE_GENERATION,
        payload
    );

    const siliconflowImageUrl = response.data?.images?.[0]?.url;
    if (!siliconflowImageUrl) {
        throw new Error("KolorsGen Plugin Error: Failed to extract image URL from SiliconFlow API response.");
    }

    const imageResponse = await axios({
        method: 'get',
        url: siliconflowImageUrl,
        responseType: 'arraybuffer',
        timeout: 60000
    });

    let imageExtension = 'png';
    const contentType = imageResponse.headers['content-type'];
    if (contentType && contentType.startsWith('image/')) {
        imageExtension = contentType.split('/')[1];
    } else {
        const urlExtMatch = siliconflowImageUrl.match(/\.([^.?]+)(?:[?#]|$)/);
        if (urlExtMatch && urlExtMatch[1]) {
            imageExtension = urlExtMatch[1];
        }
    }

    const generatedFileName = `${uuidv4()}.${imageExtension}`;
    const imageDir = path.join(PROJECT_BASE_PATH, 'image', 'kolorsgen');
    const localImagePath = path.join(imageDir, generatedFileName);

    await fs.mkdir(imageDir, { recursive: true });
    await fs.writeFile(localImagePath, imageResponse.data);

    const relativePathForUrl = path.join('kolorsgen', generatedFileName).replace(/\\/g, '/');
    const accessibleImageUrl = `${VAR_HTTP_URL}:${SERVER_PORT}/pw=${IMAGESERVER_IMAGE_KEY}/images/${relativePathForUrl}`;

    const altText = args.prompt ? args.prompt.substring(0, 80) + (args.prompt.length > 80 ? "..." : "") : generatedFileName;
    const imageHtml = `<img src="${accessibleImageUrl}" alt="${altText}" width="300">`;
    const responseSeed = response.data?.seed !== undefined ? response.data.seed : (payload.seed !== undefined ? payload.seed : 'N/A');

    const imageBuffer = imageResponse.data;
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const imageMimeType = `image/${imageExtension}`;

    const result = {
        content: [
            {
                type: 'text',
                text: `图片已成功生成！\n- 提示词: ${args.prompt}\n- 分辨率: ${args.resolution}\n- Seed: ${responseSeed}\n- 可访问URL: ${accessibleImageUrl}`
            },
            {
                type: 'image_url',
                image_url: {
                    url: `data:${imageMimeType};base64,${base64Image}`
                }
            }
        ],
        details: {
            serverPath: `image/kolorsgen/${generatedFileName}`,
            fileName: generatedFileName,
            prompt: args.prompt,
            resolution: args.resolution,
            seed: responseSeed,
            imageUrl: accessibleImageUrl
        }
    };

    return result;
}

async function main() {
    let inputChunks = [];
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) {
        inputChunks.push(chunk);
    }
    const inputData = inputChunks.join('');

    try {
        if (!inputData.trim()) {
            console.log(JSON.stringify({ status: "error", error: "KolorsGen Plugin Error: No input data received from stdin." }));
            process.exit(1);
            return;
        }
        const parsedArgs = JSON.parse(inputData);
        const resultObject = await generateImageAndSave(parsedArgs);
        console.log(JSON.stringify({ status: "success", result: resultObject }));
    } catch (e) {
        const errorMessage = e.message || "Unknown error in KolorsGen plugin";
        console.log(JSON.stringify({
            status: "error",
            error: errorMessage.startsWith("KolorsGen Plugin Error:") ? errorMessage : `KolorsGen Plugin Error: ${errorMessage}`
        }));
        process.exit(1);
    }
}

main();
