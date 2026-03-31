import { useState } from "react";
import CanvasBoard from "../components/CanvasBoard";
import Toolbar from "../components/Toolbar";
import AIChat from "../components/AIChat";
import { useNavigate } from "react-router-dom";

export default function Whiteboard() {

  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(5);

  const navigate = useNavigate();

  const userName = localStorage.getItem("userName");

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    navigate("/");

  };

  return (

    <div className="flex h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">

      <div className="w-56 bg-white shadow-xl p-4 self-start">

        <Toolbar
          setColor={setColor}
          setTool={setTool}
          setBrushSize={setBrushSize}
          brushSize={brushSize}
        />

      </div>

      <div className="flex-1 flex flex-col items-center justify-center">

        <h2 className="text-white text-xl font-bold mb-3">
         <div className="w-full flex justify-center mb-4">

  <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-xl shadow-lg">

    <h2 className="text-lg font-semibold text-gray-800">
      Hello, <span className="text-purple-600">{userName}</span> 👋
    </h2>

  </div>

</div>
        </h2>

        <div className="bg-white rounded-xl shadow-2xl p-4">

          <CanvasBoard
            color={color}
            tool={tool}
            brushSize={brushSize}
          />

        </div>

        <button
          onClick={logout}
          className="mt-4 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
        >
          Logout
        </button>

      </div>

      <div className="w-80 bg-white shadow-xl">

        <AIChat />

      </div>

    </div>

  );

}