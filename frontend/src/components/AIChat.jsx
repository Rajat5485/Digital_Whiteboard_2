import { useState } from "react";

export default function AIChat() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = message;

    setChat(prev => [
      ...prev,
      { role: "user", text: userMessage }
    ]);

    setMessage("");
    setLoading(true);

    try {

      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!res.ok) {
        throw new Error("Server error");
      }

      const data = await res.json();

      setChat(prev => [
        ...prev,
        { role: "ai", text: data.reply || "No response from AI" }
      ]);

    } catch (error) {

      console.log("AI Error:", error);

      setChat(prev => [
        ...prev,
        { role: "ai", text: "AI is not available right now." }
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

    <div className="w-80 h-full bg-white rounded-xl shadow-xl flex flex-col">

      {/* Header */}

      <div className="p-3 border-b font-bold text-lg text-center">
        AI Assistant 🤖
      </div>


      {/* Chat messages */}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">

        {chat.map((c, i) => (

          <div key={i}>

            {c.role === "user" ? (

              <div className="text-right">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-lg">
                  {c.text}
                </span>
              </div>

            ) : (

              <div>
                <span className="bg-gray-200 px-3 py-1 rounded-lg">
                  {c.text}
                </span>
              </div>

            )}

          </div>

        ))}

        {loading && (
          <p className="text-gray-500 text-sm">
            AI thinking...
          </p>
        )}

      </div>


      {/* Input */}

      <div className="p-3 border-t flex gap-2">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ask AI..."
          className="flex-1 border rounded px-2 py-1 outline-none"
        />

        <button
          onClick={sendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>

  );

}