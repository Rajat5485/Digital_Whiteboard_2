import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const name = localStorage.getItem("userName");
    setUserRole(role);
    setUserName(name);

    // Fetch classes based on role
    const fetchClasses = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const endpoint = role === "teacher" ? `${import.meta.env.VITE_API_URL || "https://digital-whiteboard-2-1.onrender.com"}/api/classrooms/teacher` : `${import.meta.env.VITE_API_URL || "https://digital-whiteboard-2-1.onrender.com"}/api/classrooms/student`;
        const res = await fetch(`${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setClasses(data);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [navigate, userRole]);

  const handleCreateClass = () => {
    const className = prompt("Enter class name:");
    if (className) {
      // TODO: Implement create class
      alert("Create class functionality to be implemented");
    }
  };

  const handleJoinClass = () => {
    const code = prompt("Enter class code:");
    if (code) {
      // TODO: Implement join class
      alert("Join class functionality to be implemented");
    }
  };

  const handleEnterClass = (classId) => {
    navigate(`/board?classId=${classId}`);
  };

  const handleGenerateLink = async (classId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "https://digital-whiteboard-2-1.onrender.com"}/api/classrooms/generate-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classId }),
      });

      if (res.ok) {
        const data = await res.json();
        navigator.clipboard.writeText(data.joinLink);
        alert("Join link copied to clipboard!");
      } else {
        alert("Failed to generate link");
      }
    } catch (error) {
      alert("Error generating link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Welcome, {userName}
          </h1>
          <p className="text-white/80">
            {userRole === "teacher" ? "Teacher Dashboard" : "Student Dashboard"}
          </p>
        </div>

        <div className="bg-white/10 rounded-3xl border border-white/20 p-8 backdrop-blur-2xl">
          {userRole === "teacher" ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Classes</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {classes.map((cls) => (
                  <div key={cls._id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-2">{cls.name}</h3>
                    <p className="text-white/60 mb-4">Code: {cls.code}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEnterClass(cls._id)}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                      >
                        Enter Class
                      </button>
                      <button
                        onClick={() => handleGenerateLink(cls._id)}
                        className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        Generate Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateClass}
                className="mt-6 w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold hover:scale-105 transition"
              >
                Create New Class
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Classes</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {classes.map((cls) => (
                  <div key={cls._id} className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-2">{cls.name}</h3>
                    <p className="text-white/60 mb-4">Teacher: {cls.teacher?.name}</p>
                    <button
                      onClick={() => handleEnterClass(cls._id)}
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
                    >
                      Enter Class
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleJoinClass}
                className="mt-6 w-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white py-3 px-6 rounded-xl font-semibold hover:scale-105 transition"
              >
                Join New Class
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}