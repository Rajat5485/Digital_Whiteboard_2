import { useState } from "react";

export default function AIChat() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateFallbackReply = (text) => {
    const cleaned = (text || "").trim();
    if (!cleaned) return "Please type a message.";
    return `I am temporarily unavailable from the server, but I received: "${cleaned}". Please try again shortly.`;
  };

  const sendMessage = async () => {

    if (!message.trim() || loading) return;

    const userMessage = message.trim();

    setChat(prev => [
      ...prev,
      { role: "user", text: userMessage }
    ]);

    setMessage("");
    setLoading(true);

    try {

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Server error");
      }

      setChat(prev => [
        ...prev,
        { role: "ai", text: data.reply || generateFallbackReply(userMessage) }
      ]);

    } catch (error) {

      console.log("AI Error:", error);

      setChat(prev => [
        ...prev,
        { role: "ai", text: generateFallbackReply(userMessage) }
      ]);

    }

    setLoading(false);

  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl bg-white flex flex-col">
      <div className="border-b px-4 py-3">
        <h3 className="text-center text-base font-bold text-slate-800">
          AI Assistant
        </h3>
        <p className="text-center text-xs text-slate-500">
          Quick ideas, explanations and support
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">

        {chat.map((c, i) => (
          <div key={i} className={c.role === "user" ? "text-right" : "text-left"}>
            {c.role === "user" ? (
              <span className="inline-block max-w-[85%] rounded-2xl bg-indigo-600 px-3 py-2 text-sm text-white">
                {c.text}
              </span>
            ) : (
              <span className="inline-block max-w-[85%] rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow">
                {c.text}
              </span>
            )}
          </div>
        ))}

        {loading && (
          <p className="text-sm text-slate-500">
            AI thinking...
          </p>
        )}
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2 rounded-xl border border-slate-300 bg-white p-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AI..."
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-none"
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>

  );

}