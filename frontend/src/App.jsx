import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Whiteboard from "./pages/Whiteboard";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Login />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/board" element={<Whiteboard />} />
  <Route path="/register" element={<Register />} />
</Routes>
    </BrowserRouter>
  );
}