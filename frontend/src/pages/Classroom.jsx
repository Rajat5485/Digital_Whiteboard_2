import { useNavigate } from "react-router-dom";

export default function Classroom() {

  const navigate = useNavigate();

  /* CREATE CLASS (Teacher) */

  const createClass = async () => {

    const res = await fetch("/api/classroom/create", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },

      body: JSON.stringify({ name: "Math Class" })

    });

    const data = await res.json();

    if (data._id) {
      localStorage.setItem("classId", data._id);
    }

    alert("Class Code: " + data.code);

    navigate("/board");

  };

  /* JOIN CLASS (Student) */

  const joinClass = async () => {

    const code = prompt("Enter class code");

    const res = await fetch("/api/classroom/join", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },

      body: JSON.stringify({ code })

    });

    const data = await res.json();

    if (!data || !data._id) {
      alert("Class not found");
      return;
    }

    localStorage.setItem("classId", data._id);

    navigate("/board");

  };

  return (

    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-indigo-600 to-purple-700">

      <h1 className="text-3xl text-white font-bold">
        Classroom
      </h1>

      <button
        onClick={createClass}
        className="bg-green-500 text-white px-6 py-3 rounded-lg"
      >
        Create Class (Teacher)
      </button>

      <button
        onClick={joinClass}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg"
      >
        Join Class (Student)
      </button>

    </div>

  );

}