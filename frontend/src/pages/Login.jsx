import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || res.statusText || "Login failed");
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name || "User");
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("userRole", data.role || "student");

      // Go to board
      navigate("/board");

    } catch (error) {

      alert(error.message);

    }

    setLoading(false);

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <p className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold tracking-wide text-purple-700">
          DIGITAL WHITEBOARD
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-800">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in to continue your classroom session.
        </p>

        <div className="mt-6 space-y-4">
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

          <button
            onClick={handleLogin}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 font-semibold text-white shadow-lg transition hover:opacity-95"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="cursor-pointer font-semibold text-purple-700 hover:text-purple-800"
          >
            Register
          </span>
        </p>
      </div>
    </div>

  );

}