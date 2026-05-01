import { useNavigate } from "react-router-dom";
import AttendanceSummary from "../components/AttendanceSummary";
import AttendanceTracker from "../components/AttendanceTracker";

export default function Attendance() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 py-6">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate("/board")}
            className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-white/20"
          >
            Return to Whiteboard
          </button>
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <AttendanceTracker />
          <div className="rounded-2xl border border-white/20 bg-white/95 shadow-2xl">
            <AttendanceSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
