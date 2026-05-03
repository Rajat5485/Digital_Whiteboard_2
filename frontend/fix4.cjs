const fs = require('fs');
const files = [
    './src/components/AIChat.jsx',
    './src/pages/Classroom.jsx',
    './src/pages/Dashboard.jsx',
    './src/pages/JoinClass.jsx',
    './src/pages/Login.jsx',
    './src/pages/Register.jsx',
    './src/components/AttendanceSummary.jsx',
    './src/components/AttendanceTracker.jsx'
];

const BACKEND_URL = "https://digital-whiteboard-2-1.onrender.com";

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace the previous fallback logic with a safer one that checks for the string 'undefined'
    // Pattern to match: ${import.meta.env.VITE_API_URL || "https://..."}
    const regex = /\$\{import\.meta\.env\.VITE_API_URL\s*\|\|\s*".*?"\}/g;
    const replacement = '${(import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "undefined") ? import.meta.env.VITE_API_URL : "' + BACKEND_URL + '"}';
    
    content = content.replace(regex, replacement);
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
