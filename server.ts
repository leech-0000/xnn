/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY provided; backend will use heuristic fallback parsing.");
}

// Fallback manual parser for Taiwanese foods when Gemini is not connected or fails
function fallbackParseDiet(text: string) {
  const normalized = text.toLowerCase();
  const foods: any[] = [];
  
  // Database of common Taiwanese foods and general estimations
  const dictionary = [
    { keys: ['茶葉蛋', '茶葉蛋', '蛋'], name: '茶葉蛋 (顆)', cal: 75, carb: 1, prot: 7, fat: 5 },
    { keys: ['地瓜', '番薯', '紅薯'], name: '烤地瓜 (小)', cal: 120, carb: 28, prot: 1.5, fat: 0.2 },
    { keys: ['冰淇淋紅茶', '紅茶冰淇淋'], name: '冰淇淋紅茶 (杯)', cal: 250, carb: 45, prot: 1, fat: 5 },
    { keys: ['紅茶', '綠茶', '烏龍茶', '青茶'], name: '含糖手搖茶 (杯)', cal: 150, carb: 35, prot: 0, fat: 0 },
    { keys: ['雞胸肉', '雞胸'], name: '即食雞胸肉 (片)', cal: 140, carb: 1, prot: 24, fat: 2 },
    { keys: ['咖啡', '拿鐵'], name: '鮮奶拿鐵 (杯)', cal: 160, carb: 12, prot: 8, fat: 6 },
    { keys: ['黑咖啡', '美式'], name: '黑咖啡 (中杯)', cal: 15, carb: 1, prot: 0.5, fat: 0 },
    { keys: ['牛奶', '鮮奶', '鮮乳'], name: '全脂牛奶 (杯)', cal: 150, carb: 12, prot: 8, fat: 8 },
    { keys: ['香蕉'], name: '香蕉 (根)', cal: 90, carb: 23, prot: 1, fat: 0.3 },
    { keys: ['蘋果'], name: '蘋果 (顆)', cal: 60, carb: 15, prot: 0.3, fat: 0.2 },
    { keys: ['排骨飯', '便當'], name: '台式排骨便當 (份)', cal: 750, carb: 95, prot: 30, fat: 28 },
    { keys: ['雞肉飯', '火雞肉飯'], name: '雞肉飯 (碗)', cal: 380, carb: 55, prot: 15, fat: 12 },
    { keys: ['牛肉麵'], name: '紅燒牛肉麵 (碗)', cal: 650, carb: 75, prot: 32, fat: 22 },
    { keys: ['沙拉', '生菜'], name: '和風生菜沙拉 (份)', cal: 80, carb: 8, prot: 1.5, fat: 4 },
    { keys: ['水餃'], name: '豬肉水餃 (10顆)', cal: 400, carb: 42, prot: 15, fat: 18 },
    { keys: ['燕麥', '麥片'], name: '燕麥粥 (碗)', cal: 150, carb: 26, prot: 5, fat: 2 },
    { keys: ['火鍋', '涮涮鍋'], name: '個人小火鍋 (鍋)', cal: 680, carb: 60, prot: 28, fat: 32 },
    { keys: ['吐司', '土司'], name: '烤吐司 (片)', cal: 110, carb: 22, prot: 3.5, fat: 1 }
  ];

  // Try to find matching words
  for (const item of dictionary) {
    for (const key of item.keys) {
      if (normalized.includes(key)) {
        // Simple search for counts or custom multipliers
        let qty = 1;
        const index = normalized.indexOf(key);
        // Look for number prefixes near key
        const numMatch = normalized.slice(Math.max(0, index - 3), index).match(/([0-9]+|兩|二|一|三|四|五)/);
        if (numMatch) {
          const matchedText = numMatch[1];
          if (matchedText === '一') qty = 1;
          else if (matchedText === '二' || matchedText === '兩') qty = 2;
          else if (matchedText === '三') qty = 3;
          else if (matchedText === '四') qty = 4;
          else if (matchedText === '五') qty = 5;
          else {
            const parsedNum = parseInt(matchedText, 10);
            if (!isNaN(parsedNum)) qty = parsedNum;
          }
        }
        
        foods.push({
          name: `${item.name}${qty > 1 ? ` x ${qty}` : ''}`,
          calories: item.cal * qty,
          carbs: item.carb * qty,
          protein: item.prot * qty,
          fat: item.fat * qty
        });
        break; // skip other keys for this dictionary item
      }
    }
  }

  // If nothing matched, generate an educated default item
  if (foods.length === 0) {
    foods.push({
      name: `一般健康餐食 (${text.length > 20 ? text.substring(0, 15) + '...' : text})`,
      calories: 320,
      carbs: 45,
      protein: 15,
      fat: 8
    });
  }

  // Aggregate
  const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
  const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
  const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
  const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

  return {
    foods,
    totalCalories,
    totalCarbs,
    totalProtein,
    totalFat
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API router info / healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', usingGemini: ai !== null });
  });

  // AI-powered diet parser endpoint
  app.post('/api/diet/analyze', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: '飲食內容為必填欄位。' });
    }

    // Try Gemini if available
    if (ai) {
      try {
        console.log("Analyzing diet using Gemini: ", text);
        const prompt = `您是一位專業、資深且嚴謹的國家級營養師與食品數據分析師。
請對使用者輸入的日常飲食內容（繁體中文）進行極其精準、真實的營養分析，拆解出其中的食物品項，並極限估算出它們的「熱量 (kcal)」、碳水化合物「克 (g)」、蛋白質「克 (g)」、脂肪「克 (g)」。

飲食內容：「${text}」

【高精確度解析指令 (CRITICAL Guidelines)】:
1. 優先採用官方與權威數據：若該食物、商品或品牌在您的知識庫中有官方披露的資訊，例如連鎖便利商店 (如 7-Eleven、全家)、知名連鎖餐飲 (如麥當勞、星巴克、八方雲集、路易莎)、或政府健康機構 (如衛福部食品營養成分資料庫、USDA) 公開披露的最新官方標示熱量與營養資訊，【必須優先採用並記錄該官方發布的精確數值】，而非隨機口語猜測的粗估值。
2. 真實反映食物分量與烹調細節：
   - 充分考量台灣在地與主流飲食習慣（如：排骨便當、雞腿便當、客家小炒等），必須將「配菜、主食米飯、油炸裹粉、調味油與醬汁、勾芡與裹糖」等因素納入估算。例如一個正常的排骨便當熱量大約為 750-950 kcal，請依照真實市售狀況給予最準確的分項統計，請勿低估。
   - 解析時，請在食物品項名稱中清楚備註（如：「連鎖超商茶葉蛋 (官方數據)」、「排骨便當 (估計值)」、「衛福部白米飯資料 (1碗)」），讓使用者一目了然其數值來源。
3. 嚴格驗證總熱量：各單項食物熱量（calories）累加之和（totalCalories）必須與整體回傳的 totalCalories 完全吻合，且應儘量符合能量守恆乘數 (1g 碳水 = 4kcal, 1g 蛋白 = 4kcal, 1g 脂肪 = 9kcal)。

請將各食物品項及加總的「三大營養素（碳水/蛋白/脂肪）」和「熱量 (kcal)」包裝成 JSON 回傳。 
注意：請務必回傳合法的 JSON 對象，不可有 Markdown 標記，直接輸出 JSON 字串即可！

JSON 格式要求例子：
{
  "foods": [
    { "name": "7-Eleven茶葉蛋 (官方數據 / 1顆)", "calories": 75, "carbs": 1, "protein": 7, "fat": 5 },
    { "name": "烤地瓜 (衛福部數據 / 100g)", "calories": 120, "carbs": 28, "protein": 1, "fat": 0 }
  ],
  "totalCalories": 195,
  "totalCarbs": 29,
  "totalProtein": 8,
  "totalFat": 5
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                foods: {
                  type: Type.ARRAY,
                  description: "各食物品項明細",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "中文品項名稱" },
                      calories: { type: Type.INTEGER, description: "卡路里數（大卡/kcal）" },
                      carbs: { type: Type.INTEGER, description: "碳水克數（g）" },
                      protein: { type: Type.INTEGER, description: "蛋白克數（g）" },
                      fat: { type: Type.INTEGER, description: "脂肪克數（g）" }
                    },
                    required: ["name", "calories", "carbs", "protein", "fat"]
                  }
                },
                totalCalories: { type: Type.INTEGER, description: "總熱量" },
                totalCarbs: { type: Type.INTEGER, description: "總碳水" },
                totalProtein: { type: Type.INTEGER, description: "總蛋白" },
                totalFat: { type: Type.INTEGER, description: "總脂肪" }
              },
              required: ["foods", "totalCalories", "totalCarbs", "totalProtein", "totalFat"]
            }
          }
        });

        const jsonText = response.text?.trim() || "";
        const parsed = JSON.parse(jsonText);
        return res.json(parsed);

      } catch (geminiError) {
        console.error("Gemini analyze failed, running fallback parser:", geminiError);
        // Fallback gracefully to regex/heuristic parsing
        const result = fallbackParseDiet(text);
        return res.json({ ...result, error: 'Gemini 解析出錯，已為您調用在地化啟發式解析' });
      }
    } else {
      // Fallback parser since API key is absent
      console.log("No Gemini API configured. Running fallback parser.");
      const result = fallbackParseDiet(text);
      return res.json({ ...result, note: '正在使用在地化啟發式解析。請在 Secrets 面板配置 GEMINI_API_KEY 以解鎖真實 AI 分析！' });
    }
  });

  // Serve static files / Vite HMR routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve HTML
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Development custom fullstack server running at http://localhost:${PORT}`);
  });
}

startServer();
