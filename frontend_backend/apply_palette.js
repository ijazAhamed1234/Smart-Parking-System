const fs = require('fs');
const p = require('path');

function f(dir) {
  let r = [];
  fs.readdirSync(dir).forEach(file => {
    const curr = p.join(dir, file);
    if (fs.statSync(curr).isDirectory()) {
      r = r.concat(f(curr));
    } else if (curr.endsWith('.js') || curr.endsWith('.jsx')) {
      r.push(curr);
    }
  });
  return r;
}

const files = f('./src');

const map = {
  // Hex matching (case insensitive regex)
  '#0a0b10': '#172e27',
  '#0d0f18': '#172e27',
  '#101828': '#172e27',
  '#12141d': '#374d42',
  '#333333': '#374d42',
  '#333': '#374d42',
  '#00ff66': '#b7b6b8',
  '#ff3366': '#8d918d',
  '#ffcc00': '#5c7068',
  '#b266ff': '#5c7068',
  '#3b82f6': '#8d918d',
  '#ffffff': '#e2e2df',
  '#fff': '#e2e2df',

  // RGBA rgb values
  '0,255,102': '183,182,184',
  '255,51,102': '141,145,141',
  '255,204,0': '92,112,104',
  '178,102,255': '92,112,104',
  '59,130,246': '141,145,141',
  '18,20,29': '55,77,66',
  '255,255,255': '226,226,223',
  '0, 255, 102': '183, 182, 184',
  '255, 51, 102': '141, 145, 141',
  '255, 204, 0': '92, 112, 104',
  '178, 102, 255': '92, 112, 104',
  '59, 130, 246': '141, 145, 141',
  '18, 20, 29': '55, 77, 66',
  '255, 255, 255': '226, 226, 223',
};

files.forEach(file => {
  let t = fs.readFileSync(file, 'utf8');
  let orig = t;
  
  t = t.replace(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g, (match) => {
    let m = match.toLowerCase();
    if (map[m]) return map[m];
    if (m.length === 4) {
      let exp = '#' + m[1]+m[1]+m[2]+m[2]+m[3]+m[3];
      if (map[exp]) return map[exp];
    }
    return match;
  });

  Object.keys(map).forEach(k => {
    if (k.startsWith('#')) return;
    t = t.split(k).join(map[k]);
  });

  if (orig !== t) {
    fs.writeFileSync(file, t, 'utf8');
    console.log('Updated', file);
  }
});
