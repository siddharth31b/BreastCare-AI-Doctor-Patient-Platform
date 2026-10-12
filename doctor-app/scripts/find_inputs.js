const fs = require('fs');
const path = require('path');
const content = fs.readFileSync(path.join(__dirname, '../window_dump.xml'), 'utf-8');
const regex = /text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
let m;
while ((m = regex.exec(content)) !== null) {
  if (m[1].includes('सत्यापन') || m[1].includes('पहचान')) {
    const x = Math.round((parseInt(m[2]) + parseInt(m[4])) / 2);
    const y = Math.round((parseInt(m[3]) + parseInt(m[5])) / 2);
    console.log(`Text "${m[1]}" bounds [${m[2]},${m[3]}][${m[4]},${m[5]}] -> Center: (${x}, ${y})`);
  }
}
