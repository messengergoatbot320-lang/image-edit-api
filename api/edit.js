const OpenAI = require("openai");
const axios = require("axios");

// ── Meta ──────────────────────────────────────────────
// Author  : Rocky Chowdhury
// Owner   : Rocky Chowdhury
// Purpose : AI-powered image editing endpoint
// Route   : GET /gedit?prompt=...&url=...
// ─────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ── Author info endpoint ──
  if (req.method === "GET" && !req.query.prompt && !req.query.url) {
    return res.status(200).json({
      name: "Image Edit API",
      author: "Rocky Chowdhury",
      owner: "Rocky Chowdhury",
      version: "1.0.0",
      usage: "/gedit?prompt=your_prompt&url=image_url",
      status: "online",
    });
  }

  const { prompt, url } = req.query;

  // ── Validation ──
  if (!prompt || !url) {
    return res.status(400).json({
      error: "Missing parameters",
      author: "Rocky Chowdhury",
      required: ["prompt", "url"],
      example: "/gedit?prompt=make+it+black+white&url=https://example.com/img.jpg",
    });
  }

  try {
    const decodedPrompt = decodeURIComponent(prompt);
    const decodedUrl = decodeURIComponent(url);

    // ── Download image and convert to base64 ──
    const imageResponse = await axios.get(decodedUrl, {
      responseType: "arraybuffer",
      timeout: 15000,
    });

    const base64Image = Buffer.from(imageResponse.data).toString("base64");
    const mimeType = imageResponse.headers["content-type"] || "image/jpeg";

    // ── Send to GPT-4o Vision ──
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI image editor created by Rocky Chowdhury. 
          Analyze the image and describe exactly how to apply the edit: "${decodedPrompt}". 
          Then generate a detailed DALL-E prompt to recreate this image with the requested edit applied.
          Respond ONLY with the DALL-E prompt, nothing else.`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `Edit this image: ${decodedPrompt}. Generate a DALL-E prompt that recreates this image with the edit applied.`,
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const dallePrompt = response.choices[0].message.content.trim();

    // ── Generate edited image with DALL-E 3 ──
    const imageGenResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: dallePrompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const editedImageUrl = imageGenResponse.data[0].url;

    // ── Stream image back to client ──
    const finalImage = await axios.get(editedImageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("X-Author", "Rocky Chowdhury");
    res.setHeader("X-Owner", "Rocky Chowdhury");
    return res.status(200).send(Buffer.from(finalImage.data));

  } catch (error) {
    console.error("API Error:", error.message);
    return res.status(500).json({
      error: "Image editing failed",
      message: error.message,
      author: "Rocky Chowdhury",
    });
  }
};
