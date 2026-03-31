import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 flex items-center justify-center text-white">

      <div className="bg-white/20 backdrop-blur-2xl p-12 rounded-3xl shadow-2xl text-center w-[450px]">

        <h1 className="text-4xl font-bold mb-6">
          👋 Welcome to Creative Board
        </h1>

        <p className="mb-8 text-white/80">
          Real-time AI Powered Digital Classroom
        </p>

        <button
          onClick={() => navigate("/board")}
          className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-transform shadow-lg"
        >
          🎨 Enter Whiteboard
        </button>

      </div>
    </div>
  );
}