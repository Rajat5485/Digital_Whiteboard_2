export const askAI = async (req, res) => {
  try {
    const { message } = req.body;

    // For now dummy response
    const aiResponse = `AI says: You asked - ${message}`;

    res.json({ reply: aiResponse });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};