const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'DEVELOPER_DOCS.md');
const htmlPath = path.join(__dirname, 'DEVELOPER_DOCS.html');

// Convert markdown to HTML body using marked
const htmlBody = execSync(`npx -y marked -i "${mdPath}"`, { encoding: 'utf-8' });

// Wrap in a full HTML document with print-friendly CSS
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Community Store / Swych — Technical Documentation</title>
  <style>
    @page { margin: 20mm 18mm; size: A4; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1d23;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px 30px;
      font-size: 14px;
    }
    h1 { font-size: 26px; color: #003C71; border-bottom: 3px solid #0198CD; padding-bottom: 8px; margin-top: 40px; }
    h2 { font-size: 20px; color: #003C71; border-bottom: 1px solid #E5E7EB; padding-bottom: 6px; margin-top: 32px; }
    h3 { font-size: 16px; color: #0072CE; margin-top: 24px; }
    h4 { font-size: 14px; color: #1a1d23; margin-top: 16px; }
    hr { border: none; border-top: 2px solid #E5E7EB; margin: 28px 0; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
    th, td { border: 1px solid #E5E7EB; padding: 8px 12px; text-align: left; }
    th { background: #003C71; color: white; font-weight: 600; }
    tr:nth-child(even) { background: #F5F6F8; }
    code { background: #EEF0F4; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'SFMono-Regular', Menlo, Consolas, monospace; }
    pre { background: #1a1d23; color: #e5e7eb; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12.5px; line-height: 1.5; }
    pre code { background: none; padding: 0; color: inherit; }
    blockquote { border-left: 4px solid #0072CE; margin: 16px 0; padding: 8px 16px; background: #EEF0F4; border-radius: 0 8px 8px 0; }
    blockquote p { margin: 4px 0; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    a { color: #0072CE; text-decoration: none; }
    strong { color: #003C71; }
    .task-list-item { list-style: none; margin-left: -20px; }
    .task-list-item input { margin-right: 6px; }

    /* Alert boxes */
    blockquote p:first-child strong {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    @media print {
      body { padding: 0; }
      pre { page-break-inside: avoid; }
      table { page-break-inside: avoid; }
      h2, h3 { page-break-after: avoid; }
    }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

fs.writeFileSync(htmlPath, fullHtml, 'utf-8');
console.log('HTML generated at:', htmlPath);
console.log('');
console.log('To create a PDF:');
console.log('  1. Open DEVELOPER_DOCS.html in your browser');
console.log('  2. Press Ctrl+P → Save as PDF');
