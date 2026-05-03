import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function JoinClass() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassInfo = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "https://digital-whiteboard-2-1.onrender.com"}/api/classrooms/${classId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Class not found");
        }

        const data = await res.json();
        setClassInfo(data);
      } catch (error) {
        alert("Invalid class link");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchClassInfo();
  }, [classId, navigate]);

  const handleJoinClass = () => {
    navigate(`/board?classId=${classId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Class not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Join Class</h1>
        <div className="mb-4">
          <p className="text-gray-700"><strong>Class Name:</strong> {classInfo.name}</p>
          <p className="text-gray-700"><strong>Teacher:</strong> {classInfo.teacher?.name || "Unknown"}</p>
        </div>
        <button
          onClick={handleJoinClass}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Join Class
        </button>
      </div>
    </div>
  );
}