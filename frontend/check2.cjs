const fs = require('fs');
const path = require('path');
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) { 
            results.push(file);
        }
    });
    return results;
}
const files = walk('./src');
const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('.')) {
            let fullPath = path.resolve(path.dirname(file), importPath);
            const extensions = ['', '.js', '.jsx', '.css', '/index.js', '/index.jsx'];
            let resolvedPath = null;
            let actualBase = null;
            let expectedBase = path.basename(fullPath);
            for (let ext of extensions) {
                if (fs.existsSync(fullPath + ext)) {
                    resolvedPath = fullPath + ext;
                    expectedBase = path.basename(resolvedPath);
                    break;
                }
            }
            if (resolvedPath) {
                const dir = path.dirname(resolvedPath);
                const filesInDir = fs.readdirSync(dir);
                let foundExact = false;
                for (let f of filesInDir) {
                    if (f === expectedBase) {
                        foundExact = true;
                        break;
                    }
                    if (f.toLowerCase() === expectedBase.toLowerCase()) {
                        actualBase = f;
                    }
                }
                if (!foundExact) {
                    console.log('MISMATCH in ' + file + ': expected ' + expectedBase + ', found ' + actualBase);
                }
            } else {
                console.log('NOT FOUND in ' + file + ': ' + importPath);
            }
        }
    }
});
