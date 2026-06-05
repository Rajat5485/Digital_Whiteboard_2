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
  onLogout,
}) {
  return (
    <div className="bg-white border-t border-slate-200/80 px-6 py-3.5 flex flex-wrap gap-4 justify-between items-center select-none transition-colors duration-200">
      {/* LEFT SECTION: DRAWING HISTORY & CLEAR */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Undo / Redo */}
        <div className="flex rounded-xl border border-slate-200/60 bg-slate-50 p-1 shadow-xs">
          <button
            onClick={onUndo}
            className="p-1.5 text-slate-550 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all active:scale-95 flex items-center justify-center"
            title="Undo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            className="p-1.5 text-slate-550 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all active:scale-95 flex items-center justify-center"
            title="Redo"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2m18-8l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Clear Page Action */}
        <button
          onClick={onClearBoard}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 active:scale-[0.97] transition-all duration-200"
          title="Clear Entire Page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>

        {/* Vertical Divider */}
        <span className="h-5 w-px bg-slate-200 mx-1"></span>

        {/* Local Downloads */}
        <div className="flex gap-2 bg-slate-50 border border-slate-200/60 rounded-xl p-1">
          <button
            onClick={onDownloadBoard}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-200/50 text-slate-700 active:scale-[0.97] transition-all"
            title="Download current frame as PNG"
          >
            PNG
          </button>
          <button
            onClick={onDownloadPdf}
            className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-slate-200/50 text-slate-700 active:scale-[0.97] transition-all"
            title="Download all frames as PDF"
          >
            PDF
          </button>
        </div>
      </div>

      {/* RIGHT SECTION: MULTIPAGE NAVIGATION & SESSION LOGOUT */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Pagination Group */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/60 bg-slate-50 p-1 shadow-xs">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 0}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Previous Page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <span className="text-xs font-bold text-slate-700 px-1.5">
            Page {currentPage + 1} of {pages.length}
          </span>

          <button
            onClick={onNextPage}
            disabled={currentPage >= pages.length - 1}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors"
            title="Next Page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Add Page Action */}
        <button
          onClick={onAddPage}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-sm active:scale-[0.97] transition-all duration-200"
          title="Create New Slide Page"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Page
        </button>

        {/* Vertical Divider */}
        <span className="h-5 w-px bg-slate-200 mx-1"></span>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.97] transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}