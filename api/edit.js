const axios = require("axios");

// ═══════════════════════════════════════════
//   Image Edit API v1.0
//   Owner  : Rocky Chowdhury
//   Author : Rocky Chowdhury
//   Method : POST
//   Body   : { prompt, images: [base64], format }
// ═══════════════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Owner", "Rocky Chowdhury");
  res.setHeader("X-Author", "Rocky Chowdhury");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Info page (GET) ──
  if (req.method === "GET") {
    return res.status(200).json({
      name: "🖼️ Image Edit API",
      owner: "Rocky Chowdhury",
      author: "Rocky Chowdhury",
      status: "online ✅",
      version: "1.0.0",
      method: "POST",
      body: {
        prompt: "your edit instruction",
        images: ["base64_image_string"],
        format: "jpg"
      }
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { prompt, images, format } = req.body;

  if (!prompt || !images || !images[0]) {
    return res.status(400).json({
      error: "Missing parameters",
      owner: "Rocky Chowdhury",
      required: {
        prompt: "edit instruction text",
        images: ["base64 encoded image"],
        format: "jpg or png"
      }
    });
  }

  try {
    const base64Image = images[0];
    const imageBuffer = Buffer.from(base64Image, "base64");

    // ── Try Hugging Face (best quality) ──
    const hfToken = process.env.HF_TOKEN;
    if (hfToken) {
      try {
        const hfResult = await editWithHuggingFace(imageBuffer, prompt, hfToken);
        if (hfResult) {
          res.setHeader("Content-Type", "image/jpeg");
          return res.status(200).send(hfResult);
        }
      } catch (e) {
        console.log("HF failed:", e.message);
      }
    }

    // ── Fallback: Pollinations AI ──
    const fallback = await editWithPollinations(prompt);
    if (fallback) {
      res.setHeader("Content-Type", "image/jpeg");
      return res.status(200).send(fallback);
    }

    throw new Error("All services failed");

  } catch (error) {
    console.error("Edit Error:", error.message);
    return res.status(500).json({
      error: "Image editing failed",
      message: error.message,
      owner: "Rocky Chowdhury"
    });
  }
};

// ── Hugging Face instruct-pix2pix ──
async function editWithHuggingFace(imageBuffer, prompt, token) {
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

// ── Pollinations fallback ──
async function editWithPollinations(prompt) {
  const models = ["flux", "flux-realism", "turbo"];
  const model = models[Math.floor(Math.random() * models.length)];
  const fullPrompt = `${prompt}, photorealistic, ultra detailed, high quality 4k`;
  const encoded = encodeURIComponent(fullPrompt);
  const seed = Math.floor(Math.random() * 999999);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=1024&height=1024&nologo=true&seed=${seed}`;

  const response = await axios.get(apiUrl, {
    responseType: "arraybuffer",
    timeout: 55000,
    headers: { "User-Agent": "Mozilla/5.0" }
  });

  if (response.status === 200 && response.data.byteLength > 5000) {
    return Buffer.from(response.data);
  }
  return null;
}
