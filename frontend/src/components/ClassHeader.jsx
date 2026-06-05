export default function ClassHeader({
  userName,
  classId,
  isTeacher,
  isAllowedToDraw,
  micOn,
  cameraOn,
  handRaised,
  selectedStudents,
  onToggleMic,
  onToggleCamera,
  onRaiseHand,
  showToolbar,
  setShowToolbar,
  showChat,
  setShowChat,
  showParticipants,
  setShowParticipants,
}) {
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
      {/* User Info Details */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-1">
            {userName}
          </h2>
          <p className="text-[11px] font-semibold text-slate-400">
            Classroom: <span className="text-indigo-600 font-bold">{classId || "Loading..."}</span>
            <span className="mx-2 text-slate-200">|</span>
            Role:{" "}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              isTeacher 
                ? "bg-indigo-50 text-indigo-700 border border-indigo-200/40" 
                : "bg-slate-100 text-slate-600 border border-slate-200/40"
            }`}>
              {isTeacher ? "TEACHER" : "STUDENT"}
            </span>
          </p>
          {!isTeacher && (
            <p className={`text-[10px] font-bold mt-1 tracking-wide leading-none ${
              isAllowedToDraw ? "text-emerald-600" : "text-amber-600"
            }`}>
              {isAllowedToDraw 
                ? "✓ Drawing Privileges Enabled" 
                : "⏳ Awaiting Drawing Privileges"}
            </p>
          )}
        </div>
      </div>

      {/* Control Actions Panel */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {/* Media Devices controls */}
        <button
          onClick={onToggleMic}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
            micOn 
              ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-transparent shadow-sm shadow-green-100" 
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {micOn ? (
            <>
              🎙️ <span className="font-bold">Mic On</span>
            </>
          ) : (
            <>
              🔇 <span className="font-semibold text-slate-500">Mic Off</span>
            </>
          )}
        </button>

        <button
          onClick={onToggleCamera}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
            cameraOn 
              ? "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white border-transparent shadow-sm shadow-green-100" 
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {cameraOn ? (
            <>
              📹 <span className="font-bold">Camera On</span>
            </>
          ) : (
            <>
              📷 <span className="font-semibold text-slate-500">Camera Off</span>
            </>
          )}
        </button>

        {/* Raise hand for students */}
        {!isTeacher && (
          <button
            onClick={onRaiseHand}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
              handRaised 
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-transparent shadow-sm shadow-amber-100 animate-pulse" 
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ✋ {handRaised ? "Lower Hand" : "Raise Hand"}
          </button>
        )}

        {/* Vertical Divider */}
        <span className="h-6 w-px bg-slate-200 mx-1"></span>

        {/* Interface toggles */}
        <button
          onClick={() => setShowToolbar(!showToolbar)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
            showToolbar
              ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100/70"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          🛠️ {showToolbar ? "Hide Toolbar" : "Show Toolbar"}
        </button>

        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
            showParticipants
              ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100/70"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          👥 {showParticipants ? "Hide Panel" : "Show Panel"}
        </button>

        <button
          onClick={() => setShowChat(!showChat)}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.97] ${
            showChat
              ? "bg-indigo-50/70 border-indigo-200/80 text-indigo-700 hover:bg-indigo-100/70"
              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          🤖 {showChat ? "Hide Chat" : "Show Chat"}
        </button>
      </div>
    </div>
  );
}