const fs = require('fs');
const files = [
    './src/components/AIChat.jsx',
    './src/pages/Classroom.jsx',
    './src/pages/Dashboard.jsx',
    './src/pages/JoinClass.jsx',
    './src/pages/Login.jsx',
    './src/pages/Register.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/"\/api\/(.*?)"/g, '`${import.meta.env.VITE_API_URL}/api/$1`');
    content = content.replace(/`\/api\/(.*?)`/g, '`${import.meta.env.VITE_API_URL}/api/$1`');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
});
