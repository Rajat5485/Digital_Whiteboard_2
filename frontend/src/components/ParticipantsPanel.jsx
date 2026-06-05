import React from "react";

export default function ParticipantsPanel({
  classUsers,
  userId,
  isTeacher,
  selectedStudents,
  toggleSelectedStudent,
  handleToggleDrawPermission,
  handleApproveAttendance,
}) {
  const teachersCount = classUsers.filter((u) => u.role === "teacher").length;
  const studentsCount = classUsers.filter((u) => u.role !== "teacher").length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            Active Participants
          </h3>
        </div>
        <div className="flex gap-1.5 text-[10px] font-extrabold">
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100/40">
            {teachersCount} {teachersCount === 1 ? "Teacher" : "Teachers"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200/50">
            {studentsCount} {studentsCount === 1 ? "Student" : "Students"}
          </span>
        </div>
      </div>

      {/* Participants List */}
      <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
        {classUsers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400 font-medium">Waiting for participants to join...</p>
          </div>
        ) : (
          classUsers.map((user) => {
            const isCurrentUser = user.userId === userId;
            const isStudent = user.role !== "teacher";
            const selected = selectedStudents.includes(user.userId);

            return (
              <div
                key={user.socketId || user.userId}
                className={`group border rounded-xl p-3.5 transition-all duration-300 ${
                  selected
                    ? "border-indigo-500 bg-indigo-50/30 shadow-sm shadow-indigo-100/50"
                    : user.handRaised
                    ? "border-amber-400 bg-amber-50/40 shadow-sm shadow-amber-100/40"
                    : "border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 hover:shadow-md hover:shadow-slate-100/80"
                }`}
              >
                {/* User Info Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {user.userName}
                      </p>
                      {isCurrentUser && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-bold tracking-wide">
                          YOU
                        </span>
                      )}
                      {user.role === "teacher" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold tracking-wide border border-indigo-200/40">
                          HOST
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {user.role === "teacher" ? "Class Instructor" : `Student ID: ${user.userId.substring(0, 8)}...`}
                    </p>
                  </div>

                  {/* Status Indicator Badges */}
                  <div className="flex gap-1 items-center shrink-0">
                    {user.canDraw && (
                      <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100" title="Can Draw">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </span>
                    )}
                    {user.handRaised && (
                      <span className="p-1 rounded-md bg-amber-100 text-amber-700 border border-amber-200 animate-bounce" title="Hand Raised">
                        ✋
                      </span>
                    )}
                    {user.micOn ? (
                      <span className="p-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200" title="Mic On">
                        🎙️
                      </span>
                    ) : (
                      <span className="p-1 rounded-md bg-red-50 text-red-400 border border-red-100" title="Muted">
                        🔇
                      </span>
                    )}
                    {user.cameraOn ? (
                      <span className="p-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200" title="Video On">
                        📹
                      </span>
                    ) : (
                      <span className="p-1 rounded-md bg-red-50 text-red-400 border border-red-100" title="Video Off">
                        📷
                      </span>
                    )}
                  </div>
                </div>

                {/* Teacher Action Controls */}
                {isTeacher && isStudent && (
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2.5">
                    {/* Top Row: Attendance and Draw Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleDrawPermission(user.socketId, !user.canDraw, user.userName)
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all duration-200 active:scale-[0.98] ${
                          user.canDraw
                            ? "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-sm shadow-red-100"
                            : "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-sm shadow-green-100"
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {user.canDraw ? "Revoke Draw" : "Allow Draw"}
                      </button>
                      
                      <button
                        onClick={() => handleApproveAttendance(user.socketId, user.userName)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-indigo-100 transition-all duration-200 active:scale-[0.98]"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Approve Attendance
                      </button>
                    </div>

                    {/* Bottom Row: Selection Pill */}
                    <button
                      onClick={() => toggleSelectedStudent(user.userId)}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all duration-200 active:scale-[0.98] ${
                        selected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {selected ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Selected for Notes & Reports
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Select for Notes & Reports
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}