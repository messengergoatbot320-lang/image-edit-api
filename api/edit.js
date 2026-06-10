const axios = require("axios");

// Owner : Rocky Chowdhury
// API   : Image Edit via Pollinations AI (FREE - No API Key needed)

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { prompt, url } = req.query;

  // Info endpoint
  if (!prompt && !url) {
    return res.status(200).json({
      name: "Image Edit API",
      owner: "Rocky Chowdhury",
      author: "Rocky Chowdhury",
      status: "online ✅",
      usage: "/gedit?prompt=make it black and white&url=IMAGE_URL"
    });
  }

  if (!prompt || !url) {
    return res.status(400).json({
      error: "Missing parameters",
      owner: "Rocky Chowdhury",
      required: ["prompt", "url"]
    });
  }

  try {
    const decodedPrompt = decodeURIComponent(prompt);
    const decodedUrl = decodeURIComponent(url);

    // Pollinations AI - FREE image generation with prompt + image reference
    const editPrompt = `${decodedPrompt}. Based on this image: ${decodedUrl}. High quality, detailed, realistic edit.`;
    const encodedPrompt = encodeURIComponent(editPrompt);
    
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true`;

    const imageResponse = await axios.get(pollinationsUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("X-Owner", "Rocky Chowdhury");
    res.setHeader("X-Author", "Rocky Chowdhury");
    return res.status(200).send(Buffer.from(imageResponse.data));

  } catch (error) {
    return res.status(500).json({
      error: "Image editing failed",
      message: error.message,
      owner: "Rocky Chowdhury"
    });
  }
};
