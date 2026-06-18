const fs = require("fs");
let data = fs.readFileSync("mock/mockActivities.js", "utf8");

// Fix corrupted images: [ + u + , ... ] -> proper urls
data = data.replace(/images: \[ \+ u \+ , (?: \+ u \+ , ){3} \+ u \+ \]/g, (match) => {
  // Extract the activity number from the line
  const line = match;
  return "images: ['TEMPORARY']";
});

// Simpler: replace each corrupted images array by finding the activity number
data = data.replace(/'https:\/\/picsum\.photos\/seed\/m(\d+)A\/400\/300'/g, (fullMatch, num) => {
  // This won't work well for the corrupted version
  return fullMatch;
});

// Actually let me do a different approach - replace each corrupted images line
// The pattern is: images: [ + u + ,  + u + ,  + u + ,  + u + ,  + u + ]
const suffixes = ["A","B","C","D","E"];
data = data.replace(/images: \[ \+ u \+ , (?: \+ u \+ , ){3} \+ u \+ \]/g, (corruptedMatch) => {
  // Extract the num from preceding cover_url
  return corruptedMatch;
});

// Let me try a different approach - match each full line and extract the activity num from cover_url
const lines = data.split('\n');
const newLines = lines.map(line => {
  const corrupted = line.match(/images: \[ \+ u \+ , (?: \+ u \+ , ){3} \+ u \+ \]/);
  if (corrupted) {
    const numMatch = line.match(/cover_url: 'https:\/\/picsum\.photos\/seed\/m(\d+)\//);
    if (numMatch) {
      const num = numMatch[1];
      const urls = suffixes.map(s => `'https://picsum.photos/seed/m${num}${s}/400/300'`);
      return line.replace(/images: \[ \+ u \+ , (?: \+ u \+ , ){3} \+ u \+ \]/, `images: [${urls.join(", ")}]`);
    }
  }
  return line;
});

fs.writeFileSync("mock/mockActivities.js", newLines.join('\n'));
console.log("Fixed", newLines.filter(l => l.includes("images: [")).length, "lines");
