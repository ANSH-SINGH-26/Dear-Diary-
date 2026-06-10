const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(/llama3-8b-8192/g, 'llama-3.3-70b-versatile');

fs.writeFileSync('server.ts', serverContent);
