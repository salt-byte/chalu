// 把 src 里的四个文件拼成一个 dist/index.html。
const fs = require('fs'), p = require('path'), r = f => fs.readFileSync(p.join(__dirname, 'src', f), 'utf8');
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>岔路</title>
<link rel="icon" href="data:,">
<meta name="description" content="有些路只能走一次。在这里，两条路你都走。">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@600;900&display=swap" rel="stylesheet">
<style>${r('game.css')}</style>
</head>
<body>
${r('body.html')}
<script src="three.min.js"></script>
<script>
${r('engine.js').split("if(typeof module")[0]}
${r('compose.js').split("if(typeof module")[0]}
${r('prompt.js').replace(/^if\(typeof LIB.*\n/, '').split("if(typeof module")[0]}
${r('stage3d.js')}
${r('game.js')}
</script>
</body>
</html>`;
fs.mkdirSync(p.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(p.join(__dirname, 'dist', 'index.html'), html);
fs.copyFileSync(p.join(__dirname, 'vendor', 'three.min.js'), p.join(__dirname, 'dist', 'three.min.js'));
// 单文件试玩版：把三维库也内联进去，离线可开
fs.writeFileSync(p.join(__dirname, 'dist', 'standalone.html'), html.replace('<script src="three.min.js"></script>', () => '<script>' + fs.readFileSync(p.join(__dirname, 'vendor', 'three.min.js'), 'utf8') + '</script>'));
// GitHub Pages 用的纯静态版：docs/ 目录，不需要服务端
fs.mkdirSync(p.join(__dirname, 'docs'), { recursive: true });
fs.writeFileSync(p.join(__dirname, 'docs', 'index.html'), html);
fs.copyFileSync(p.join(__dirname, 'vendor', 'three.min.js'), p.join(__dirname, 'docs', 'three.min.js'));
fs.writeFileSync(p.join(__dirname, 'docs', '.nojekyll'), '');
console.log('built dist/index.html', html.length);
