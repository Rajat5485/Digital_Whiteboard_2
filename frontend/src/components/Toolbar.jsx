import React from "react";

// Crisp professional SVG Icons for each tool
const Icons = {
  pencil: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  paintbrush: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21c-1.657 0-3-1.343-3-3 0-.828.336-1.578.879-2.121L12.5 8.25l3.25 3.25-7.629 7.629c-.543.543-1.293.871-2.121.871zM16.5 7.5l-3.25-3.25m3.25 3.25a2.5 2.5 0 113.5 3.5l-3.5-3.5z" />
    </svg>
  ),
  marker: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12a2 2 0 002-2V6a2.28 2.28 0 00-.66-1.59L17.59 2.66A2.28 2.28 0 0016 2h-4a2 2 0 00-2 2v6a2 2 0 002 2h6zM4 22h12v-2H4v2zM10 12v6H6v-6h4z" />
    </svg>
  ),
  highlighter: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l.94-2.822 4.706 4.706-2.822.94a1 1 0 01-1.21-.598l-1.016-1.616a1 1 0 01-.598-1.21zM12.822 10.47l4.706-4.706 3.294 3.294-4.706 4.706-3.294-3.294z" />
    </svg>
  ),
  eraser: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  line: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20L20 4" />
    </svg>
  ),
  arrow: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  rectangle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  "fill-rectangle": (
    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  circle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  "fill-circle": (
    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  triangle: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 16H3L12 3z" />
    </svg>
  ),
  "fill-triangle": (
    <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3l9 16H3L12 3z" />
    </svg>
  ),
  select: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-6 5L7 3l12 10-4 2z" />
    </svg>
  ),
  fill: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
    </svg>
  ),
  text: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 6v4m16-4v4m-8-4v14m-3 0h6" />
    </svg>
  ),
  bucket: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2h-3m-4 0a2 2 0 00-2 2v2m-6-2l6-6m0 0l6 6m-6-6v6" />
    </svg>
  ),
};

const categories = [
  {
    title: "Brushes",
    items: [
      { id: "pencil", label: "Pencil" },
      { id: "paintbrush", label: "Paintbrush" },
      { id: "marker", label: "Marker" },
      { id: "highlighter", label: "Highlighter" },
      { id: "eraser", label: "Eraser" },
    ]
  },
  {
    title: "Shapes",
    items: [
      { id: "line", label: "Line" },
      { id: "arrow", label: "Arrow" },
      { id: "rectangle", label: "Rect Outline" },
      { id: "fill-rectangle", label: "Rect Filled" },
      { id: "circle", label: "Circle Outline" },
      { id: "fill-circle", label: "Circle Filled" },
      { id: "triangle", label: "Triangle" },
      { id: "fill-triangle", label: "Triangle Filled" },
    ]
  },
  {
    title: "Utilities",
    items: [
      { id: "select", label: "Select" },
      { id: "fill", label: "Fill" },
      { id: "text", label: "Text" },
      { id: "bucket", label: "Bucket" },
    ]
  }
];

const colorPresets = [
  { value: "#0f172a", label: "Charcoal" },
  { value: "#2563eb", label: "Indigo" },
  { value: "#059669", label: "Emerald" },
  { value: "#dc2626", label: "Rose" },
  { value: "#d97706", label: "Amber" },
  { value: "#7c3aed", label: "Purple" },
];

export default function Toolbar({ tool, setColor, setTool, setBrushSize, brushSize }) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-md rounded-2xl p-4 flex flex-col gap-4 select-none">
      {/* Upper Section: Divided Columns */}
      <div className="flex flex-wrap items-center justify-between gap-5">
        
        {/* Tool Groups */}
        <div className="flex flex-wrap items-center gap-6">
          {categories.map((cat) => (
            <div key={cat.title} className="flex items-center gap-2">
              {/* Category label badge */}
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider select-none bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
                {cat.title}
              </span>
              
              {/* Buttons pill */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 rounded-xl p-1">
                {cat.items.map((item) => {
                  const active = tool === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTool(item.id)}
                      className={`p-2 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
                        active
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-100"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                      }`}
                      title={item.label}
                    >
                      {Icons[item.id] || <span>📍</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Section: Styling & Brush parameters */}
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Colors Selection Section */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider select-none bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
              Color
            </span>
            
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl p-1">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setColor(preset.value)}
                  className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 active:scale-90 transition-transform shadow-xs relative group"
                  style={{ backgroundColor: preset.value }}
                  title={preset.label}
                />
              ))}

              {/* Custom Color Input Wrapper */}
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200 bg-white hover:border-slate-350 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-all">
                <input
                  type="color"
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Custom Picker"
                />
                <span className="text-[10px]">🎨</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <span className="h-6 w-px bg-slate-200"></span>

          {/* Size slider */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider select-none bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5">
              Size
            </span>
            
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl p-1.5 px-3 min-w-[150px]">
              <input
                type="range"
                min="1"
                max="35"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-black text-indigo-650 tracking-tight select-none">
                {brushSize}px
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}