import React, { useState, useEffect } from "react";

export default function TeacherControlPanel({
  classId,
  selectedStudents,
  // notes functions
  sendPdfToWhatsApp,
  sendPdfByEmail,
  sendLinkToWhatsApp,
  sendLinkByEmail,
  handleSendNotes,
  // attendance report functions
  sendAttendancePdfToWhatsApp,
  sendAttendancePdfByEmail,
  // session teardown
  handleEndClass,
}) {
  const [minMinutes, setMinMinutes] = useState(10);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial classroom threshold setting on load
  useEffect(() => {
    async function fetchClassroomDetails() {
      try {
        const token = localStorage.getItem("token");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
        const res = await fetch(`${apiUrl}/api/classroom/${classId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.minimumTimeRequired) {
            setMinMinutes(Math.round(data.minimumTimeRequired / 60));
          }
        }
      } catch (err) {
        console.error("Failed to load classroom minimum time criteria:", err);
      } finally {
        setLoading(false);
      }
    }
    if (classId) {
      fetchClassroomDetails();
    }
  }, [classId]);

  // Save the new attendance duration criteria
  const handleSaveCriteria = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/classroom/update-criteria`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId,
          minimumTimeRequired: minMinutes,
        }),
      });

      if (res.ok) {
        alert(`Attendance threshold successfully set to ${minMinutes} minutes!`);
      } else {
        const data = await res.json();
        alert("Failed to update criteria: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error updating criteria.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-5 select-none">
      {/* Title */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-50">
        <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">
          Teacher Control Hub
        </h3>
      </div>

      {/* 1. Dynamic Auto Attendance Criteria */}
      <div className="space-y-2.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Auto Attendance Criteria
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              max="180"
              value={minMinutes}
              onChange={(e) => setMinMinutes(e.target.value)}
              className="w-full pl-3 pr-10 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              Min
            </span>
          </div>
          <button
            onClick={handleSaveCriteria}
            disabled={updating || loading}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg active:scale-95 transition-all shadow-sm"
          >
            {updating ? "Saving..." : "Set Threshold"}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Students active for more than <span className="font-semibold text-slate-600">{minMinutes} minutes</span> are automatically marked present.
        </p>
      </div>

      {/* 2. Sharing Center (Unified Buttons) */}
      <div className="space-y-3 pt-1 border-t border-slate-50">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Class Sharing & Invites
        </label>

        {/* Board Lecture Notes PDF */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400">BOARD LECTURE NOTES (PDF)</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={sendPdfToWhatsApp}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.755.002-2.61-1.01-5.063-2.85-6.906C16.628 2.099 14.177 1.08 11.58 1.08c-5.441 0-9.866 4.372-9.87 9.76-.002 1.817.492 3.593 1.433 5.157L2.176 21.84l6.471-1.686z" />
              </svg>
              WhatsApp
            </button>
            <button
              onClick={sendPdfByEmail}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          </div>
        </div>

        {/* Classroom invite links */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400">CLASSROOM JOIN LINK</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={sendLinkToWhatsApp}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              WhatsApp Link
            </button>
            <button
              onClick={sendLinkByEmail}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Email Link
            </button>
          </div>
        </div>

        {/* Attendance Report PDF */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400">ATTENDANCE REPORT (PDF)</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={sendAttendancePdfToWhatsApp}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.863-9.755.002-2.61-1.01-5.063-2.85-6.906C16.628 2.099 14.177 1.08 11.58 1.08c-5.441 0-9.866 4.372-9.87 9.76-.002 1.817.492 3.593 1.433 5.157L2.176 21.84l6.471-1.686z" />
              </svg>
              WhatsApp
            </button>
            <button
              onClick={sendAttendancePdfByEmail}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/50 active:scale-95 transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          </div>
        </div>
      </div>

      {/* 3. Live text push */}
      <div className="space-y-2.5 pt-1 border-t border-slate-50">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Student Messaging
        </label>
        <button
          onClick={handleSendNotes}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-600 text-white shadow-sm shadow-indigo-100 active:scale-[0.97] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          Send Notes to Selected ({selectedStudents.length})
        </button>
      </div>

      {/* 4. Danger Zone (End Session) */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={handleEndClass}
          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50 active:scale-[0.97] transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          End Classroom Session
        </button>
      </div>
    </div>
  );
}
