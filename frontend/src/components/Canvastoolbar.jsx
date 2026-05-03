import { jsPDF } from "jspdf";
import socket from "../services/socket";

export default function CanvasToolbar({
  canvasRef,
  pages,
  currentPage,
  onUndo,
  onRedo,
  onClearBoard,
  onDownloadBoard,
  onDownloadPdf,
  onPrevPage,
  onNextPage,
  onAddPage,
  onSendPdfToWhatsApp,
  onShareLink,
  onLogout,
}) {
  return (
    <div className="bg-gray-50 border-t px-4 py-3 flex flex-wrap gap-2 justify-center items-center">
      {/* Share */}
      <button
        onClick={onSendPdfToWhatsApp}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        📤 WhatsApp PDF
      </button>
      <button
        onClick={onShareLink}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
      >
        🔗 Share Link
      </button>
      <button
        onClick={onLogout}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors"
      >
        🚪 Logout
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* History */}
      <button
        onClick={onUndo}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
      >
        ↶ Undo
      </button>
      <button
        onClick={onRedo}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
      >
        ↷ Redo
      </button>
      <button
        onClick={onClearBoard}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
      >
        🗑️ Clear
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Export */}
      <button
        onClick={onDownloadBoard}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
      >
        💾 PNG
      </button>
      <button
        onClick={onDownloadPdf}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
      >
        📄 PDF
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Pagination */}
      <button
        onClick={onPrevPage}
        disabled={currentPage === 0}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-40 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-xs font-semibold text-gray-600 px-1">
        {currentPage + 1} / {pages.length}
      </span>
      <button
        onClick={onNextPage}
        disabled={currentPage >= pages.length - 1}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-40 transition-colors"
      >
        Next →
      </button>
      <button
        onClick={onAddPage}
        className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        + Page
      </button>
    </div>
  );
}