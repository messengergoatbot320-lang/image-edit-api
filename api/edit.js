// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📁 FILE NAME  : edit.js
// 📂 LOCATION   : api/edit.js  (GitHub repo)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const axios = require("axios");

// ═══════════════════════════════════
//  Image Edit API v4.0
//  Owner  : Rocky Chowdhury
//  Author : Rocky Chowdhury
//  POST   : /api/edit
//  Body   : { prompt, images:[base64], format }
// ═══════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Owner", "Rocky Chowdhury");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    return res.status(200).json({
      name: "Image Edit API",
      owner: "Rocky Chowdhury",
      author: "Rocky Chowdhury",
      status: "online ✅",
      version: "4.0.0",
      method: "POST /api/edit",
      body: { prompt: "string", images: ["base64"], format: "jpg" }
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST method" });
  }

  const { prompt, images, format } = req.body || {};

  if (!prompt || !images || !images[0]) {
    return res.status(400).json({
      error: "Missing parameters",
      required: { prompt: "text", images: ["base64 string"], format: "jpg" }
    });
  }

  const imageBuffer = Buffer.from(images[0], "base64");

  // ── Service 1: Hugging Face ──
  const hfToken = process.env.HF_TOKEN;
  if (hfToken) {
    try {
      const result = await huggingFaceEdit(imageBuffer, prompt, hfToken);
      if (result) {
        res.setHeader("Content-Type", "image/jpeg");
        return res.status(200).send(result);
      }
    } catch (e) {
      console.log("HF error:", e.message);
    }
  }

  // ── Service 2: Gemini (Google FREE) ──
  const geminiKey = process.env.GEMINI_KEY;
  if (geminiKey) {
    try {
      const result = await geminiEdit(imageBuffer, prompt, geminiKey);
      if (result) {
        res.setHeader("Content-Type", "image/jpeg");
        return res.status(200).send(result);
      }
    } catch (e) {
      console.log("Gemini error:", e.message);
    }
  }

  // ── Service 3: Pollinations (no key) ──
  try {
    const result = await pollinationsEdit(prompt);
    if (result) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.status(200).send(result);
    }
  } catch (e) {
    console.log("Pollinations error:", e.message);
  }

  return res.status(500).json({
    error: "All services failed. Please try again.",
    owner: "Rocky Chowdhury"
  });
};

async function huggingFaceEdit(imageBuffer, prompt, token) {
  const base64 = imageBuffer.toString("base64");
  const response = await axios.post(
    "https://api-inference.huggingface.co/models/timbrooks/instruct-pix2pix",
    {
      inputs: base64,
      parameters: {
        prompt: prompt,
        num_inference_steps: 20,
        image_guidance_scale: 1.5,
        guidance_scale: 7
      }
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      responseType: "arraybuffer",
      timeout: 55000
    }
  );
  if (response.status === 200 && response.data.byteLength > 5000) {
    return Buffer.from(response.data);
  }
  return null;
}

async function geminiEdit(imageBuffer, prompt, apiKey) {
  const base64 = imageBuffer.toString("base64");
  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
    {
      contents: [
        {
          parts: [
            { text: `Edit this image: ${prompt}. Keep the same subject and composition, just apply the requested changes.` },
            { inline_data: { mime_type: "image/jpeg", data: base64 } }
          ]
        }
      ],
      generationConfig: { responseModalities: ["IMAGE"] }
    },
    {
      headers: { "Content-Type": "application/json" },
      timeout: 55000
    }
  );

  const parts = response.data?.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if (part.inlineData?.data) {
        return Buffer.from(part.inlineData.data, "base64");
      }
    }
  }
  return null;
}

async function pollinationsEdit(prompt) {
  const models = ["flux", "flux-realism", "turbo"];
  const model = models[Math.floor(Math.random() * models.length)];
  const encoded = encodeURIComponent(`${prompt}, photorealistic, high quality, 4k`);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=1024&height=1024&nologo=true&seed=${seed}`;

  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 55000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (response.status === 200 && response.data.byteLength > 5000) {
    return Buffer.from(response.data);
  }
  return null;
}
