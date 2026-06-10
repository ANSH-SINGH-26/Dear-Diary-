const fs = require('fs');
let content = fs.readFileSync('src/services/aiProvider.ts', 'utf8');

content = content.replace(/configure your Groq API Key/g, "configure your Groq API Key");
content = content.replace(/configure your Gemini API Key/g, "configure your Groq API Key");
content = content.replace(/add your API_KEY/g, "add your GROQ_API_KEY");
content = content.replace(/Gemini API Key/g, "Groq API Key");

fs.writeFileSync('src/services/aiProvider.ts', content);
