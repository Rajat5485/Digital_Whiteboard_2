import express from "express";
import axios from "axios";

const router = express.Router();
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

const generateLocalReply = (message) => {
  const text = (message || "").trim();

  if (!text) {
    return "Please type a message so I can help.";
  }

  if (text.toLowerCase().includes("summary")) {
    return `Quick summary: ${text.slice(0, 140)}${text.length > 140 ? "..." : ""}`;
  }

  return `I could not reach the AI provider right now, but I received your message: "${text}". Please try again in a moment.`;
};

router.post("/chat", async (req, res) => {

  try {

    const { message } = req.body;
    const cleanedMessage = (message || "").trim();

    if (!cleanedMessage) {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.json({
        reply: generateLocalReply(cleanedMessage),
        source: "local-fallback"
      });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [
          { role: "user", content: cleanedMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;

    res.json({
      reply: reply || generateLocalReply(cleanedMessage),
      source: reply ? "groq" : "local-fallback"
    });

  } catch (error) {

    console.log("AI ERROR:", error.response?.data || error.message);

    const fallbackMessage = (req.body?.message || "").trim();
    res.json({
      reply: generateLocalReply(fallbackMessage),
      source: "local-fallback"
    });

  }

});

export default router;