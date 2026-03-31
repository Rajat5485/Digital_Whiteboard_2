import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/chat", async (req, res) => {

  try {

    const { message } = req.body;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          { role: "user", content: message }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      reply: response.data.choices[0].message.content
    });

  } catch (error) {

    console.log("AI ERROR:", error.response?.data || error.message);

    res.status(500).json({
      error: "AI error"
    });

  }

});

export default router;