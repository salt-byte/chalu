# 岔路

有些路只能走一次。在这里，两条路你都走。

写下一个决策难题，游戏把它拆成两条路，让你同时走两遍，一年一年过。走完后把同样的规则各跑一千遍，告诉你：只走一遍就下结论，有多大概率看反。

## 运行

```
npm run build
DEEPSEEK_API_KEY=你的密钥 npm start
```

打开 http://localhost:3000 。不配密钥也能玩内置的两个难题。

默认用 DeepSeek（模型名 `deepseek-flash`，可用 `CHALU_MODEL` 改）。要换成 Claude：`CHALU_PROVIDER=anthropic ANTHROPIC_API_KEY=...`。

## 结构

- `src/engine.js` 模拟引擎、已核实的规律库、内置难题。页面和服务端共用。
- `src/stage3d.js` 三维舞台（three.js，已随仓库打包，不依赖外网）。
- `src/game.js` `src/game.css` `src/body.html` 游戏界面。
- `server.js` 发页面，并代玩家向 Claude 要一个「岔路包」。密钥只在服务端。
- `build.js` 把 src 拼成 `dist/index.html`。

## 三条不变的规矩

1. 模型只能按编号引用规律库里的规律。库外的一律标「未核实」，不显示出处。
2. 类比（兵法、古语）只出现在解说里，不改任何数字。
3. 所有概率都是设定的，最影响结果的几个可以在揭晓页直接改。
