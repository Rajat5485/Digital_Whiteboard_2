import { useEffect, useRef, useState } from "react";
import axios from "axios";

const AttendanceTracker = () => {
  const [classId, setClassId] = useState("");
  const [activeTime, setActiveTime] = useState(0);
  const [tabActiveDuration, setTabActiveDuration] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [isTabActive, setIsTabActive] = useState(!document.hidden);
  const [minimumTimeMet, setMinimumTimeMet] = useState(false);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const timerRef = useRef(null);
  const updateRef = useRef(null);
  const minimumTimeRequired = 600; // 10 minutes in seconds
  const token = localStorage.getItem("token");
  const API_URL = `${import.meta.env.VITE_API_URL}/api` || "const API = import.meta.env.VITE_API_URL;/api";

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!sessionActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveTime((prev) => prev + 1);
      setTabActiveDuration((prev) => prev + (isTabActive ? 1 : 0));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionActive, isTabActive]);

  useEffect(() => {
    setMinimumTimeMet(tabActiveDuration >= minimumTimeRequired);
  }, [tabActiveDuration]);

  useEffect(() => {
    if (!sessionActive || !classId) {
      if (updateRef.current) clearInterval(updateRef.current);
      return;
    }

    updateRef.current = setInterval(async () => {
      try {
        await axios.post(
          `${API_URL}/attendance/update-time`,
          {
            classId,
            tabActiveDuration,
            activeTime
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      } catch (error) {
        console.error("Error updating attendance time:", error);
      }
    }, 30000);

    return () => {
      if (updateRef.current) clearInterval(updateRef.current);
    };
  }, [sessionActive, classId, tabActiveDuration, activeTime, token]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startSession = () => {
    if (!classId.trim()) {
      setShowWarning(true);
      setStatusMessage("Enter a class ID to begin attendance.");
      return;
    }

    setShowWarning(false);
    setStatusMessage("");
    setSessionActive(true);
  };

  const stopSession = () => {
    setSessionActive(false);
    setStatusMessage("Attendance session paused. You can resume anytime.");
  };

  const resetSession = () => {
    setSessionActive(false);
    setActiveTime(0);
    setTabActiveDuration(0);
    setMinimumTimeMet(false);
    setAttendanceMarked(false);
    setStatusMessage("");
  };

  const handleMarkAttendance = async () => {
    if (!classId.trim()) {
      setShowWarning(true);
      setStatusMessage("Enter a class ID before marking attendance.");
      return;
    }

    if (!minimumTimeMet) {
      setShowWarning(true);
      setStatusMessage(`You need ${Math.ceil((minimumTimeRequired - tabActiveDuration) / 60)} more active minutes.`);
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/attendance/mark`,
        {
          classId,
          tabActiveDuration,
          activeTime
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAttendanceMarked(true);
      setStatusMessage(response.data.message || "Attendance marked successfully!");
      setShowWarning(false);
      setSessionActive(false);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || "Error marking attendance.");
      setShowWarning(true);
    }
  };

  const timeRemaining = Math.max(0, minimumTimeRequired - tabActiveDuration);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Take Attendance</h2>
          <p className="text-sm text-slate-500">
            Use the advanced attendance tracker to record active focus time and mark attendance once the minimum requirement is met.
          </p>
        </div>
        <div className="space-y-2 text-right sm:space-y-0 sm:text-right">
          <p className="text-sm font-semibold text-slate-700">Attendance Status</p>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            attendanceMarked ? "bg-emerald-100 text-emerald-800" : sessionActive ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"
          }`}>
            {attendanceMarked ? "Marked" : sessionActive ? "Session Active" : "Idle"}
          </span>
        </div>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Class ID</span>
          <input
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white"
            placeholder="Enter class ID or classroom reference"
          />
        </label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Current Focus</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{isTabActive ? "Tab Active" : "Tab Inactive"}</p>
        </div>
      </div>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-sky-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Time</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatTime(activeTime)}</p>
        </div>
        <div className={`rounded-2xl p-4 ${minimumTimeMet ? "bg-emerald-50" : "bg-amber-50"}`}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Tab Time</p>
          <p className={`mt-2 text-3xl font-bold ${minimumTimeMet ? "text-emerald-700" : "text-amber-700"}`}>
            {formatTime(tabActiveDuration)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Required</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">10m</p>
          <p className="text-sm text-slate-500">{Math.ceil(timeRemaining / 60)}m left</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
          <span>Attendance Progress</span>
          <span>{Math.min(100, Math.round((tabActiveDuration / minimumTimeRequired) * 100))}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${minimumTimeMet ? "bg-emerald-500" : "bg-amber-500"}`}
            style={{ width: `${Math.min(100, (tabActiveDuration / minimumTimeRequired) * 100)}%` }}
          />
        </div>
      </div>

      {statusMessage && (
        <div className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${showWarning ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {statusMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={sessionActive ? stopSession : startSession}
          className={`rounded-2xl px-4 py-3 font-semibold text-white transition ${
            sessionActive ? "bg-slate-600 hover:bg-slate-700" : "bg-sky-600 hover:bg-sky-700"
          }`}
        >
          {sessionActive ? "Pause Attendance" : "Start Attendance"}
        </button>
        <button
          onClick={handleMarkAttendance}
          disabled={!minimumTimeMet || attendanceMarked}
          className={`rounded-2xl px-4 py-3 font-semibold text-white transition ${
            attendanceMarked
              ? "bg-slate-400 cursor-not-allowed"
              : minimumTimeMet
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-slate-400 cursor-not-allowed"
          }`}
        >
          {attendanceMarked ? "Attendance Marked" : "Mark Attendance"}
        </button>
        <button
          onClick={resetSession}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Reset Session
        </button>
      </div>
    </div>
  );
};

export default AttendanceTracker;
