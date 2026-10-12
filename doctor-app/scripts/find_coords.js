const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../window_dump.xml'), 'utf-8');
const regex = /text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  if (match[1] === 'हिन्दी' || match[1] === 'English') {
    const x = Math.round((parseInt(match[2]) + parseInt(match[4])) / 2);
    const y = Math.round((parseInt(match[3]) + parseInt(match[5])) / 2);
    console.log(`Found "${match[1]}" at bounds [${match[2]},${match[3]}][${match[4]},${match[5]}] -> Center: (${x}, ${y})`);
  }
}
