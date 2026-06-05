import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const navigate = useNavigate();

  const handleRegister = async () => {

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    try {

      const res = await fetch(`${(import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "undefined") ? import.meta.env.VITE_API_URL : "https://digital-whiteboard-2-1.onrender.com"}/api/auth/register`, {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          name,
          email,
          password,
          role
        })

      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Registration successful!");

      navigate("/");

    } catch (error) {

      alert(error.message);

    }

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <p className="inline-flex rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold tracking-wide text-fuchsia-700">
          GET STARTED
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-800">
          Create account
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Create a new profile and start using the whiteboard.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
          />

          <div className="flex flex-col space-y-1">
            <label className="text-xs font-semibold text-slate-500 px-1">Register As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-slate-700"
            >
              <option value="student">Student (छात्र)</option>
              <option value="teacher">Teacher (शिक्षक)</option>
            </select>
          </div>

          <button
            onClick={handleRegister}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:opacity-95"
          >
            Register
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/")}
            className="cursor-pointer font-semibold text-purple-700 hover:text-purple-800"
          >
            Login
          </span>
        </p>
      </div>
    </div>

  );

}