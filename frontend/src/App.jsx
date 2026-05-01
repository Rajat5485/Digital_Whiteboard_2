import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Whiteboard from "./pages/Whiteboard";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Attendance from "./pages/Attendance";
import JoinClass from "./pages/JoinClass";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/board" element={<Whiteboard />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join/:classId" element={<JoinClass />} />
      </Routes>
    </BrowserRouter>
  );
}