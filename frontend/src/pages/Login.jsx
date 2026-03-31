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

      const res = await fetch("http://localhost:5000/api/auth/login", {

        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          password
        })

      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token and username
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.name);

      // Go to board
      navigate("/board");

    } catch (error) {

      alert(error.message);

    }

    setLoading(false);

  };

  return (

    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500">

      <div className="bg-white p-10 rounded-xl shadow-2xl w-96">

        <h1 className="text-3xl font-bold text-center mb-6">
          Digital Whiteboard
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Login to start your classroom
        </p>

        {/* EMAIL */}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        />

        {/* PASSWORD */}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded mb-6"
        />

        {/* BUTTON */}

        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded"
        >

          {loading ? "Logging in..." : "Login"}

        </button>
        <p className="text-center mt-4 text-sm">

  Don't have an account?{" "}

  <span
    onClick={() => navigate("/register")}
    className="text-purple-600 cursor-pointer font-semibold"
  >
    Register
  </span>

</p>

      </div>

    </div>

  );

}