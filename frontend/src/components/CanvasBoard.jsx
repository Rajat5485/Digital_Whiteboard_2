export default function CanvasBoard({
  canvasRef,
  canvasContainerRef,
  textInputRef,
  canvasSize,
  selectedArea,
  showTextInput,
  textInput,
  textPosition,
  color,
  brushSize,
  tool,
  isAllowedToDraw,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onTextChange,
  onTextSubmit,
  onTextKeyDown,
}) {
  const cursorStyle = isAllowedToDraw
    ? tool === "eraser" ? "not-allowed"
    : tool === "pencil" ? "crosshair"
    : tool === "marker" ? "crosshair"
    : tool === "highlighter" ? "crosshair"
    : tool === "text" ? "text"
    : tool === "select" ? "crosshair"
    : tool === "fill" ? "pointer"
    : tool === "bucket" ? "copy"
    : "default"
    : "not-allowed";

  return (
    <div ref={canvasContainerRef} className="flex-1 overflow-hidden bg-white relative">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={{ cursor: cursorStyle, width: "100%", height: "100%", display: "block" }}
        className="bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onPointerCancel={onPointerCancel}
      />

      {/* Selection Overlay */}
      {selectedArea && (
        <div
          style={{
            position: "absolute",
            left: `${(selectedArea.x / canvasSize.width) * 100}%`,
            top: `${(selectedArea.y / canvasSize.height) * 100}%`,
            width: `${(selectedArea.width / canvasSize.width) * 100}%`,
            height: `${(selectedArea.height / canvasSize.height) * 100}%`,
            border: "2px dashed #3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            pointerEvents: "none",
            borderRadius: "2px",
          }}
        />
      )}

      {/* Text Input Overlay */}
      {showTextInput && (
        <textarea
          ref={textInputRef}
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={onTextKeyDown}
          onBlur={onTextSubmit}
          style={{
            position: "absolute",
            left: `${(textPosition.x / canvasSize.width) * 100}%`,
            top: `${(textPosition.y / canvasSize.height) * 100}%`,
            width: `${(textPosition.width / canvasSize.width) * 100}%`,
            height: `${(textPosition.height / canvasSize.height) * 100}%`,
            fontSize: `${Math.max(12, brushSize * 2)}px`,
            color: color,
            backgroundColor: "rgba(255,255,255,0.9)",
            border: "1.5px solid #3b82f6",
            borderRadius: "4px",
            resize: "none",
            outline: "none",
            padding: "4px",
            fontFamily: "'DM Sans', sans-serif",
            backdropFilter: "blur(4px)",
          }}
          placeholder="Type text…"
        />
      )}
    </div>
  );
}