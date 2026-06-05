import React, { useState, useEffect } from "react";

export default function StudentAttendancePanel({ classId }) {
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await fetch(`${apiUrl}/api/attendance/my-attendance`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setAttendanceData(data);
        } else {
          setError("Failed to load attendance records.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading records.");
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [classId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center justify-center min-h-[120px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-[11px] font-bold text-slate-400">Loading Attendance...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-center text-xs text-rose-500 font-semibold">
        {error}
      </div>
    );
  }

  const { records = [], summary = { totalPresent: 0, totalAbsent: 0, totalSessions: 0 } } = attendanceData || {};
  const attendanceRate = summary.totalSessions > 0
    ? ((summary.totalPresent / summary.totalSessions) * 100).toFixed(0)
    : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4 select-none">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            My Attendance Summary
          </h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-100">
          {attendanceRate}% Present
        </span>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
          <div className="text-xs font-bold text-indigo-600">{summary.totalSessions}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Classes</div>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-xl p-2.5">
          <div className="text-xs font-bold text-emerald-600">{summary.totalPresent}</div>
          <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Present</div>
        </div>
        <div className="bg-rose-50/50 border border-rose-100/50 rounded-xl p-2.5">
          <div className="text-xs font-bold text-rose-650">{summary.totalAbsent}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Absent</div>
        </div>
      </div>

      {/* Scrollable logs list */}
      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
        <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Attendance Log</h4>
        {records.length === 0 ? (
          <div className="text-center py-4 text-xs font-medium text-slate-400">
            No attendance history available.
          </div>
        ) : (
          records.map((r, i) => {
            const dateStr = new Date(r.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const className = r.classId?.name || "Classroom";
            const activeMins = Math.floor((r.tabActiveDuration || 0) / 60);

            return (
              <div
                key={r._id || i}
                className="flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100/60 rounded-xl"
              >
                <div>
                  <div className="text-[11px] font-bold text-slate-700">{className}</div>
                  <div className="text-[9px] font-medium text-slate-400 mt-0.5">
                    {dateStr} • Active: {activeMins} mins
                  </div>
                </div>
                <div>
                  {r.marked ? (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200/40">
                      Present
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-rose-100 text-rose-700 border border-rose-200/40">
                      Absent
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
