# Cui Cui · Happy Birthday

React + TypeScript + Three.js，深邃宇宙赛博风格、手机竖版生日互动网页。
三层彩色玻璃弹珠蛋糕，蓝紫星云、远近星点、轨道光环、黄色蜡烛与全部 20 张本地拍立得。
原有 19 张拍立得全部保留，新增合照排在最后，共 20 张。

## 启动

Node.js 22.12+（推荐 24）：

```bash
cd ethan
npm install
npm run dev -- --port 5173
```

电脑打开 http://localhost:5173/ 。手机连接同一 Wi-Fi，打开终端打印的 Network 地址。

```bash
npm run build
npm run preview -- --port 4173
npm test
```

`dist/` 是可交付的静态网站。通过 HTTP 服务访问，不要直接双击 index.html。
字体、照片、占位素材全部在本地，无付费接口、后端或摄像头依赖。

## 操作

- 点击空白屏幕或底部按钮展开／聚合。
- 水平滑动旋转蛋糕，竖向滑动轻调视角。
- 点击三维照片，缓慢放大到屏幕中央并轻轻摇晃。
- 查看器支持上一张／下一张、键盘左右键和 Esc 关闭，关闭后恢复焦点。
- 连续切换保留运动位置和速度，平滑反向。
- 系统“减少动态效果”会停止自动旋转、浮动和照片摇晃。
- WebGL 不可用时显示可点击照片列表。

## 配置与照片替换

编辑 `src/config.ts`：姓名、年龄（未知默认 null 隐藏）、两行标题、祝福语、配色、弹珠和粒子数量、聚散时长（默认 2.1 秒）。
照片列表由该配置引入 `src/photos.json`：

```json
{"id":"01","src":"/photos/01.webp","thumbnail":"/photos/01-thumb.webp","label":"1月","caption":"生日快乐","aspect":0.75}
```

将图片放到 `public/photos/` 后修改路径；`aspect` 为图片宽／高，`thumbnail` 可省略。
当前图片来自上一级 `生日祝福拍立得/`，自带白边、宽底边和手写祝福，因此不重复添加边框。
新素材也应包含拍立得边框。`caption` 控制放大查看时的说明，图片内题字需通过替换图片修改。
推荐大图宽约 1100px、缩略图宽约 400px。空列表或图片加载失败使用本地 placeholder.svg。
原始素材未修改。

## 渲染与动画

- 三层圆周、侧面和顶面程序化分布，无实体奶油圆柱或底座。
- InstancedMesh + MeshPhysicalMaterial：透射、厚度、折射率、清漆高光和本地程序化环境反射。
- Points 着色器局部闪光，不对照片和标题应用全局 Bloom。
- 照片参与三维深度遮挡，散开时朝向相机，保留不同深度。
- 固定随机种子初始化端点；视口尺寸改变时重新适配照片位置，每帧不生成随机位置。
- 临界阻尼与错峰插值支持中途反转，保持同一个蛋糕结构。
- 按设备核数和屏幕选择数量、像素比，持续低帧率时降低渲染分辨率。

## 验证

`npm run build` 执行 TypeScript 检查与生产构建。
`npm test` 验证固定端点、三层结构、深度、反向连续性、回位和照片位置。

`tests/browser-check.mjs` 使用 Playwright + 本机 Chrome 检查 390×844、1440×1000、320×568：
全部照片加载、完整展开、照片点击放大、上一张／下一张、连续切换、回位、滑动旋转、点击空白区域、标题／场景／控件不重叠、无横向溢出。
运行方式：安装 Playwright 后 `node tests/browser-check.mjs`；或通过 `PLAYWRIGHT_MODULE` 指向已有安装。
截图与当次结果保存在 `test-results/cake-*.png`、`scatter-*.png`、`photo-*.png` 和 `browser-report.json`。
浏览器验证为模拟视口，未在实体 iOS／Android 手机上实测。

## GitHub Pages

```bash
npm ci
npm run build:pages
```

提交源码和生成的 `docs/`。仓库 Settings → Pages → Source 选择 Deploy from a branch，分支选 main，目录选 /docs，保存即可发布。
静态资源使用相对地址，兼容 `https://用户名.github.io/仓库名/`，照片和字体无外链。
以后修改内容后重新执行 `npm run build:pages` 并提交 `docs/`。
`docs/.nojekyll` 禁止 Jekyll 处理，保留 Vite 生成的资源。
参阅 https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site 。

2026-11-14 宇宙版：生产构建、3 项运动测试通过；390×844、320×568、1440×1000 浏览器验证通过，20 张照片加载，交互正常，运行错误 0。

## 宇宙背景音乐

首次点击页面后淡入原创 Web Audio 氛围配乐：缓慢和弦、钟琴琶音和回声。右侧圆形声波按钮可暂停／开启，切到后台暂停。无需下载音源或付费服务。音量和默认开关在 `src/config.ts` 的 `music` 中配置。浏览器通常禁止未交互自动播放。

新增第 20 张合照 `public/photos/20.jpg`，保留原始图像；`frame: true` 通过网页 Canvas 和 CSS 添加拍立得边框，排列在照片列表最后。

微信兼容版：生产页面内嵌 `public/photo-previews.json` 中的 20 张 JPEG 预览，照片纹理不依赖额外网络请求。放大照片先显示内嵌预览，高清原图加载成功后替换。入口 `wechat.html`、`birthday.html` 和首页使用相同内容。


第19张使用 public/photos/19-inscription.jpg 中按原拍立得字迹重绘的两行祝福，不再用网页字体替代。只覆盖底部文字区，人物使用原始19.webp。构建时将文字图片内嵌到 HTML，三维卡片和放大查看共用同一素材。第20张继续使用原19.webp中的生日祝福字迹。

## 专属生日序章

在原蛋糕前增加本地粒子开场：双星轨道 → 3/2/1倒计时 → Cui Cui → 生日快乐 → 许愿爱心 → 星光绽放 → 原生日蛋糕。触摸星空可扰动粒子并释放星光。所有文字和时长在 src/config.ts 的 opening 中配置。

顶部可直接看蛋糕，蛋糕控件旁可重播序章；开场时暂停蛋糕渲染，退出后恢复，同一份20张照片和原手写字迹均保留。支持减少动态效果；不需要摄像头、麦克风或外部服务。参考视频只用于学习粒子聚合、倒计时与转场方法，未使用其图片、音频或代码。

验证：npm run build:pages、npm test，以及 tests/opening-check.mjs 的手机/桌面完整流程、跳过、重播与原蛋糕检查。

开场单独使用内嵌的站酷快乐体（ZCOOL KuaiLe，SIL OFL），配合粉紫蓝淡彩与约84%–88%的文字不透明度。照片字迹不使用此字体。
