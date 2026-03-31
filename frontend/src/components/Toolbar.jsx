export default function Toolbar({ setColor, setTool, setBrushSize, brushSize }) {

  return (

    <div className="flex flex-col gap-3">

      {/* Pencil */}

      <button
        onClick={() => setTool("pencil")}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        🖊 Pencil
      </button>

      {/* Marker */}

      <button
        onClick={() => setTool("marker")}
        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        🖊 Marker
      </button>

      {/* Highlighter */}

      <button
        onClick={() => setTool("highlighter")}
        className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-2 rounded-lg shadow transition"
      >
        🖊 Highlighter
      </button>

      {/* Eraser */}

      <button
        onClick={() => setTool("eraser")}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        🧽 Eraser
      </button>

      {/* Rectangle */}

      <button
        onClick={() => setTool("rectangle")}
        className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        ⬜ Rectangle
      </button>

      {/* Circle */}

      <button
        onClick={() => setTool("circle")}
        className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        ⚪ Circle
      </button>

      {/* Line */}

      <button
        onClick={() => setTool("line")}
        className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        📏 Line
      </button>

      {/* Arrow */}

      <button
        onClick={() => setTool("arrow")}
        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg shadow transition"
      >
        ➡ Arrow
      </button>


      {/* Color Picker */}

      <div className="mt-3">

        <label className="text-sm font-semibold">Color</label>

        <input
          type="color"
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-10 mt-1"
        />

      </div>


      {/* Brush Size */}

      <div>

        <label className="text-sm font-semibold">
          Brush Size
        </label>

        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(e.target.value)}
          className="w-full mt-1"
        />

      </div>

    </div>

  );

}