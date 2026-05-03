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
  onSendNotes,
}) {
  return (
    <div className="bg-white border-b shadow-sm px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{userName}</h2>
        <p className="text-xs text-gray-500">
          Class: <span className="font-medium">{classId || "Loading..."}</span>
          {" · "}
          Role:{" "}
          <span className={isTeacher ? "text-blue-600 font-semibold" : "text-gray-600"}>
            {isTeacher ? "Teacher" : "Student"}
          </span>
        </p>
        {!isTeacher && (
          <p className={`text-xs font-semibold mt-0.5 ${isAllowedToDraw ? "text-green-600" : "text-red-500"}`}>
            {isAllowedToDraw ? "✓ Allowed to draw" : "⏳ Waiting for teacher permission"}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onToggleMic}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            micOn ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 hover:bg-gray-400"
          } text-white`}
        >
          {micOn ? "🎤 Mic On" : "🎤 Mic Off"}
        </button>

        <button
          onClick={onToggleCamera}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
            cameraOn ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 hover:bg-gray-400"
          } text-white`}
        >
          {cameraOn ? "📹 Camera On" : "📹 Camera Off"}
        </button>

        {!isTeacher && (
          <button
            onClick={onRaiseHand}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              handRaised ? "bg-amber-500 hover:bg-amber-600" : "bg-gray-300 hover:bg-gray-400"
            } text-white`}
          >
            {handRaised ? "✋ Lower Hand" : "✋ Raise Hand"}
          </button>
        )}

        {isTeacher && (
          <button
            onClick={onSendNotes}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            📝 Notes ({selectedStudents.length})
          </button>
        )}
      </div>
    </div>
  );
}