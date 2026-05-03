import { useState, useEffect } from "react";
import axios from "axios";

const AttendanceSummary = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState({
    totalPresent: 0,
    totalAbsent: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");
  const API_URL = `${import.meta.env.VITE_API_URL}/api` || "const API = import.meta.env.VITE_API_URL;/api";

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/attendance/my-attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceRecords(response.data.records);
      setSummary(response.data.summary);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching attendance");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const attendancePercentage = summary.totalSessions 
    ? Math.round((summary.totalPresent / summary.totalSessions) * 100)
    : 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold text-gray-800">My Attendance</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm text-gray-600">Total Sessions</p>
          <p className="text-3xl font-bold text-blue-600">{summary.totalSessions}</p>
        </div>
        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-gray-600">Present</p>
          <p className="text-3xl font-bold text-green-600">{summary.totalPresent}</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-gray-600">Absent</p>
          <p className="text-3xl font-bold text-red-600">{summary.totalAbsent}</p>
        </div>
        <div className={`rounded-lg border p-4 ${
          attendancePercentage >= 75 
            ? "bg-green-50 border-green-200"
            : attendancePercentage >= 50
            ? "bg-orange-50 border-orange-200"
            : "bg-red-50 border-red-200"
        }`}>
          <p className="text-sm text-gray-600">Percentage</p>
          <p className={`text-3xl font-bold ${
            attendancePercentage >= 75 
              ? "text-green-600"
              : attendancePercentage >= 50
              ? "text-orange-600"
              : "text-red-600"
          }`}>
            {attendancePercentage}%
          </p>
        </div>
      </div>

      {/* Records Table */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading attendance records...</p>
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : attendanceRecords.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No attendance records found</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Join Time
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Active Duration
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {record.classId?.name || "N/A"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(record.joinTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    <span className="font-semibold">
                      {formatDuration(record.tabActiveDuration)}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({record.tabActiveDuration}s)
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {record.marked ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                        ✓ Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        ✗ Absent
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary;
