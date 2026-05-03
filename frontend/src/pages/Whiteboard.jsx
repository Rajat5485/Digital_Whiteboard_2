import { useState } from "react";
import CanvasBoard from "../components/CanvasBoard";
import Toolbar from "../components/Toolbar";
import AIChat from "../components/AIChat";
import { useNavigate } from "react-router-dom";

export default function Whiteboard() {

  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pencil");
  const [brushSize, setBrushSize] = useState(5);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const navigate = useNavigate();

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("userName");

    navigate("/");

  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {showToolbar && (
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <Toolbar
              tool={tool}
              setColor={setColor}
              setTool={setTool}
              setBrushSize={setBrushSize}
              brushSize={brushSize}
            />
          </div>
        </header>
      )}

      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Digital Whiteboard</h1>
              <p className="text-sm text-gray-500">Collaborative drawing and learning</p>
            </div>
           
          </div>

          <div className="flex-1 p-4">
            <CanvasBoard
              color={color}
              tool={tool}
              brushSize={brushSize}
              showToolbar={showToolbar}
              showChat={showChat}
            />
          </div>
        </div>

        {showChat && (
          <aside className="w-80 bg-white border-l shadow-sm">
            <AIChat />
          </aside>
        )}
      </main>
    </div>
  );

}