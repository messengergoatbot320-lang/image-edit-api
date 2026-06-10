const axios = require("axios");

// ═══════════════════════════════════════════
//   Image Edit API
//   Owner  : Rocky Chowdhury
//   Author : Rocky Chowdhury
//   Route  : GET /gedit?prompt=...&url=...
// ═══════════════════════════════════════════

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("X-Owner", "Rocky Chowdhury");
  res.setHeader("X-Author", "Rocky Chowdhury");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { prompt, url } = req.query;

  // ── Info page ──
  if (!prompt && !url) {
    return res.status(200).json({
      name: "🖼️ Image Edit API",
      owner: "Rocky Chowdhury",
      author: "Rocky Chowdhury",
      status: "online ✅",
      version: "2.0.0",
      usage: "/gedit?prompt=make it black and white&url=IMAGE_URL",
      examples: [
        "/gedit?prompt=make it black and white&url=https://i.imgur.com/example.jpg",
        "/gedit?prompt=add anime style&url=https://i.imgur.com/example.jpg",
        "/gedit?prompt=make it look like a painting&url=https://i.imgur.com/example.jpg"
      ]
    });
  }

  if (!prompt || !url) {
    return res.status(400).json({
      error: "Missing parameters",
      owner: "Rocky Chowdhury",
      required: { prompt: "edit instruction", url: "image url" }
    });
  }

  const decodedPrompt = decodeURIComponent(prompt);
  const decodedUrl = decodeURIComponent(url);

  // ── Try multiple free services ──
  const services = [
    () => tryPollinations1(decodedPrompt, decodedUrl),
    () => tryPollinations2(decodedPrompt, decodedUrl),
    () => tryPollinations3(decodedPrompt, decodedUrl),
  ];

  for (let i = 0; i < services.length; i++) {
    try {
      const imageBuffer = await services[i]();
      if (imageBuffer) {
        res.setHeader("Content-Type", "image/jpeg");
        return res.status(200).send(imageBuffer);
      }
    } catch (err) {
      console.log(`Service ${i + 1} failed: ${err.message}`);
      if (i === services.length - 1) {
        return res.status(500).json({
          error: "All image services failed",
          message: err.message,
          owner: "Rocky Chowdhury"
        });
      }
    }
  }
};

// ── Service 1: Pollinations (model: flux) ──
async function tryPollinations1(prompt, imageUrl) {
  const fullPrompt = `${prompt}, reference image style from: ${imageUrl}, photorealistic, high quality, 4k`;
  const encoded = encodeURIComponent(fullPrompt);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux&width=1024&height=1024&nologo=true&seed=${Date.now()}`;

  const res = await axios.get(apiUrl, {
    responseType: "arraybuffer",
    timeout: 55000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImageBot/1.0)" }
  });

  if (res.status === 200 && res.data.byteLength > 5000) {
    return Buffer.from(res.data);
  }
  throw new Error("Invalid response from service 1");
}

// ── Service 2: Pollinations (model: flux-realism) ──
async function tryPollinations2(prompt, imageUrl) {
  const fullPrompt = `Edit this image - ${prompt}. Style: photorealistic. Image context: ${imageUrl}`;
  const encoded = encodeURIComponent(fullPrompt);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?model=flux-realism&width=1024&height=1024&nologo=true&seed=${Date.now()}`;

  const res = await axios.get(apiUrl, {
    responseType: "arraybuffer",
    timeout: 55000,
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
  });

  if (res.status === 200 && res.data.byteLength > 5000) {
    return Buffer.from(res.data);
  }
  throw new Error("Invalid response from service 2");
}

// ── Service 3: Pollinations (model: turbo) ──
async function tryPollinations3(prompt, imageUrl) {
  const fullPrompt = `${prompt}, inspired by image at ${imageUrl}, detailed, beautiful, high resolution`;
  const encoded = encodeURIComponent(fullPrompt);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?model=turbo&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;

  const res = await axios.get(apiUrl, {
    responseType: "arraybuffer",
    timeout: 55000,
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
  });

  if (res.status === 200 && res.data.byteLength > 5000) {
    return Buffer.from(res.data);
  }
  throw new Error("Invalid response from service 3");
}
