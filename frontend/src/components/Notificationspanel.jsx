export default function NotificationsPanel({ notifications, teacherNotes, isTeacher }) {
  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notifications</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-gray-400">No activity yet.</p>
          ) : (
            notifications.map((note, i) => (
              <div
                key={i}
                className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-gray-700"
              >
                {note}
              </div>
            ))
          )}
        </div>
      </div>

      {!isTeacher && teacherNotes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Teacher Notes</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {teacherNotes.map((note, i) => (
              <div
                key={i}
                className="text-xs bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-2"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}