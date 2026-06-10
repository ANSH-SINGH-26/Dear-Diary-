const fs = require('fs');
let serverContent = fs.readFileSync('server.ts', 'utf8');

serverContent = serverContent.replace(/\\n/g, '\n');

fs.writeFileSync('server.ts', serverContent);
