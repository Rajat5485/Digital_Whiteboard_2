const tools = [
  { id: "pencil", label: "Pencil" },
  { id: "marker", label: "Marker" },
  { id: "highlighter", label: "Highlighter" },
  { id: "eraser", label: "Eraser" },
  { id: "text", label: "Text" },
  { id: "rectangle", label: "Rectangle" },
  { id: "fill-rectangle", label: "Fill Rect" },
  { id: "circle", label: "Circle" },
  { id: "fill-circle", label: "Fill Circle" },
  { id: "triangle", label: "Triangle" },
  { id: "fill-triangle", label: "Fill Triangle" },
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
];

export default function Toolbar({ tool, setColor, setTool, setBrushSize, brushSize }) {

  return (

    <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">
        Tools
      </h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:flex-wrap xl:items-center xl:gap-2">
        {tools.map((item) => (
          <button
            key={item.id}
            onClick={() => setTool(item.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tool === item.id
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
   
      <div className="xl:min-w-[120px]">
        <label className="text-sm font-semibold text-slate-700">Color</label>
        <input
          type="color"
          onChange={(e) => setColor(e.target.value)}
          className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-slate-300 bg-white xl:w-24"
        />
      </div>

      <div className="xl:min-w-[180px]">
        <label className="text-sm font-semibold text-slate-700">
          Brush Size: {brushSize}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(e.target.value)}
          className="mt-1 w-full accent-indigo-600"
        />
      </div>
    </div>

  );

}