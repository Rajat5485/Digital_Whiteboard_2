export default function ParticipantsPanel({
  classUsers,
  userId,
  isTeacher,
  selectedStudents,
  toggleSelectedStudent,
  handleToggleDrawPermission,
  handleApproveAttendance,
}) {
  const students = classUsers.filter((u) => u.role !== "teacher");

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Participants ({classUsers.length})
        </h3>
        {isTeacher && students.length > 0 && (
          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold">
            Teacher Controls
          </span>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {classUsers.length === 0 && (
          <p className="text-sm text-gray-500">No participants yet.</p>
        )}

        {classUsers.map((user) => {
          const isCurrentUser = user.userId === userId;
          const isStudent = user.role !== "teacher";
          const selected = selectedStudents.includes(user.userId);

          return (
            <div
              key={user.socketId || user.userId}
              className={`border rounded-xl p-3 transition-colors ${
                user.handRaised
                  ? "border-amber-300 bg-amber-50"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {user.userName} {isCurrentUser && <span className="text-gray-400 font-normal">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{user.role === "teacher" ? "Teacher" : "Student"}</p>
                </div>
                <div className="flex gap-1 flex-wrap justify-end shrink-0">
                  {user.canDraw && <span className="text-xs text-green-600 font-bold">✓</span>}
                  {user.handRaised && <span className="text-xs">✋</span>}
                  {user.micOn && <span className="text-xs">🎤</span>}
                  {user.cameraOn && <span className="text-xs">📹</span>}
                </div>
              </div>

              {isTeacher && isStudent && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleToggleDrawPermission(user.socketId, !user.canDraw, user.userName)
                      }
                      className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg text-white transition-colors ${
                        user.canDraw
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {user.canDraw ? "Revoke Draw" : "Allow Draw"}
                    </button>
                    <button
                      onClick={() => handleApproveAttendance(user.socketId, user.userName)}
                      className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Attendance
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleSelectedStudent(user.userId)}
                      className="rounded accent-blue-600"
                    />
                    Select for notes
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}