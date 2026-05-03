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
    
    // Replace the previous replacement with a more robust one that includes a fallback
    content = content.replace(/\$\{import\.meta\.env\.VITE_API_URL\}/g, '${import.meta.env.VITE_API_URL || "' + BACKEND_URL + '"}');
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
