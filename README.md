# 毛凌涛 & 陈婉梦 · 双日婚礼请柬

面向手机的 React + TypeScript + Vite 原型。核心信息以中文呈现，英文保留 Day 1、Day 2、M & M 与结尾 See you there。

## 本地预览

需要 Node.js 22 或更新版本。

```sh
npm install
npm run dev
```

电脑打开终端显示的 Local 地址。手机与电脑连接同一 Wi-Fi 后，打开终端显示的 Network 地址。局域网地址只用于预览，不是可发给所有宾客的正式链接。

```sh
npm run build
npm run preview
```

构建结果在 `dist/`。无后端、无用户信息收集、无外部字体或运行时 Wiki 请求。

## 内容与结构

所有婚礼文案、姓名、日期、酒店、导航地址、照片位置与音乐路径集中在 `src/data/wedding.ts`。

```text
src/
  data/wedding.ts               婚礼配置、文案和素材路径
  sections/GreetingSequence.tsx 滚动问候
  sections/DayOne.tsx           真实婚纱照、第一天信息、6 张照片留位
  sections/WorldTransition.tsx  真实照片 → 逐级像素化 → 星露谷场景
  sections/DayTwo.tsx           第二天主图、日程和可点选的活动地图
  sections/Ending.tsx           像素夕阳和结尾
  sections/InvitationSummary.tsx 最后一页的双日时间、地点与安排汇总
  components/DayInfo.tsx        地图、复制地址、日程与场地照片
  components/VenueActions.tsx   正文与汇总页共用的地图、复制地址操作
  components/MusicControl.tsx   音乐开关
  audio/AudioDirector.ts        用户手势启动、章节音乐、淡入淡出
  hooks/useScroll.ts            滚动进度、减少动态效果、进入视口显示
public/
  assets/photos/               优化后的婚纱照和像素转场中间帧
  assets/pixel/                星露谷主图裁剪、Wiki 图标和来源记录
  audio/                       网页播放版本
scripts/
  prepare-assets.mjs            从原始文件生成网页素材
  verify.mjs                    浏览器验证与截图
```

## 已接入的信息

- 新郎毛凌涛、新娘陈婉梦。
- 2026.10.22，建德·杭州新安雷迪森酒店，新安江街道南山路1号。
- 2026.10.23，遂昌·华侨东方大酒店，牡丹亭中路8号（近太和路）。
- 两处高德导航链接与复制地址按钮。
- Day 1：下午草坪婚礼，晚上晚宴。Day 2：11:00 开始午宴，下午草坪婚礼与派对。尚未提供的下午与晚间具体钟点不做推测。

开场收为三屏：问候与近况 → 有个好消息 → 我们要结婚啦。新句子用 1.2 秒缓慢淡入（延迟 0.12 秒），旧句子用 0.32 秒退出，避免长时间叠字；停在任意位置后，当前句子都会恢复为完全清晰。滚动长度由 520svh 缩短到 320svh，无滚动锁定；减少动态效果时改为顺序阅读。

开场采用系统无衬线大字，只有问候文案，不显示品牌、音乐控件或日程导航。在“我们要结婚啦”时淡入音乐开关，婚纱照进入视口后淡入 M&M 与底部导航；隐藏控件同时设置 inert / aria-hidden，不会截获点击或键盘焦点。支持回滚、直达章节与减少动态效果。

Day 2 转场以“对了，还有个小彩蛋。”和 “One more thing…” 引导，像素化时展示“人生，也可以是星露谷。”，保留“把日子，过成喜欢的游戏。”作为副文案，也可直接点击“进入第二天”像素按钮。

夕阳结尾之后增加独立“婚礼信息”汇总页（`#info-summary`），共用 `day1` / `day2` 配置生成日期、星期、城市、酒店、完整地址及日程，不维护第二套数据。每一天提供地图和复制地址按钮；底部导航增加“信息汇总”，结尾也有入口。该页保持结尾音乐，不自动开启音频；信息不依赖滚动显现动画，适合反复查看、截图保存。未提供的具体钟点明确注明待补充。

## 配色与视觉边界

`src/styles.scss` 的 `:root` 集中定义两天共用的 Ivory、Moss、Sage，以及 Garden / Autumn 配色。Day 1 为暖白与苔绿，重要按钮统一 `#3F5844`，婚纱照仅叠加轻薄的 ivory / sage 渐变，不加粉米色滤镜。衬线字体从婚礼正文开始出现。

Day 2 使用 `#F1E7D4` 米杏底与 `#584437` 正文，卡片和像素主图边缘保持米白，绿与木色连接两天；橙、金盏黄、浆果红、湖蓝只用于树木、游戏图标及摊位细节。设计比例目标为 Day 1：75% 中性 / 20% 绿 / 5% 暖色；Day 2：55% 中性 / 20% 绿与木 / 20% 橙黄 / 5% 浆果与蓝（不对原始照片做像素面积限制）。禁止大面积纯红、酒红或橙红。

活动地图沿用原布局：咖啡木色、冰淇淋与花束浆果色、钓鱼湖蓝、网球苔绿、种子金盏黄等，统一米白标签，通过像素边线和选中勾区分。转场采用白绿 → golden hour → 秋日米杏的纵向渐变，结尾以金色天空与绿色山丘收束。照片区保留大图、双图、横图的 editorial 排版。

## 补充照片

原始 ZIP 和 PNG 不会被修改。已有婚纱照生成 640、960、1440 三档 WebP，质量设为 86；手机通过 `srcset` 选择适合的尺寸。星露谷图裁出花架、新人与小动物，保留原图的完整网页副本。

新增照片放到 `public/assets/photos/`，然后在配置里填写：

```ts
story: {
  // 保留已有标题和文案；按顺序填写至少 6 个位置。
  photos: [
    { src: '/assets/photos/story-01.webp', alt: '两个人在草地上散步', caption: '' },
    // ...
  ],
}
```

目前六个 `src` 都为空，页面保留六个空白画框。可继续增加；现有前六张采用大图、双图、横图、双图的节奏。

两处场地照片分别填写 `day1.venuePhoto.src` 与 `day2.venuePhoto.src`。目前用淡色空白场地框保留位置。`pixel.bride`、`pixel.groom`、`pixel.couple` 预留定制像素人物，其中 `pixel.couple` 填入后会用于结尾。

建议新照片先输出宽 960–1440 的 WebP，质量 82–90，以人脸与婚纱细节为准，不需要把原片直接放入 `public/`。现有照片因为背景简单，1440 宽的版本仅约 68 KB；不是对 10 MB 原图进行覆盖压缩。

重新生成现有图片与网页音频：

```sh
npm run prepare:assets
```

此命令会重建已知的派生文件，不会覆盖根目录原片，也不会移除后来上传的其他照片。

原始 ZIP、原始 MP3 与根目录的星露谷 PNG 仅保存在制作电脑上，不提交到公开仓库。克隆仓库后可直接构建，只有重新加工原始素材时才需要补齐这些本地文件。

## 音乐

| 章节             | 曲目                           | 当前文件                       |
| ---------------- | ------------------------------ | ------------------------------ |
| Day 1            | Rain · 秦基博                  | `/audio/rain.mp3`              |
| 世界转换         | Fall (Ghost Synth)，前 24 秒   | `/audio/fall.mp3`              |
| Day 2 主图与日程 | Flower Dance                   | `/audio/flower-dance.mp3`      |
| 活动地图         | Pelican Town                   | `/audio/pelican-town.mp3`      |
| 结尾             | Dance Of The Moonlight Jellies | `/audio/moonlight-jellies.mp3` |

首次打开页面不播放、不请求音频。宾客点击音乐按钮，或在“我们要结婚啦”之后点击配乐入口，才开启音乐。

Day 1 主动开启后播放 Rain。音乐由当前阅读章节决定，向上滚动也会返回对应曲目，不要求宾客停留固定时长。快速跨章节时以最后到达的章节为准。

使用 Web Audio 的 GainNode 做约 3 秒淡入淡出，避免依赖 iOS 对 HTMLAudioElement.volume 的支持。Flower Dance、Pelican Town 与结尾音乐保留完整曲目并循环；结尾的目标音量降低。切到后台时挂起音频，返回时尝试恢复；失败时保留重试入口。

Rain 从用户指定的 [Bilibili 视频 BV1at411L7Px](https://www.bilibili.com/video/BV1at411L7Px/) 提取，完整时长约 7 分 34 秒。根目录 `rain.mp3` 为较高质量的完整文件；`public/audio/rain.mp3` 为 128 kbps 的完整网页版本，约 6.9 MiB。Day 1 使用流式媒体播放并通过 Web Audio 淡入淡出，不等待整首下载和解码；不会在用户开启音乐前请求文件。

用户提供的其余原始 MP3 保留在根目录，网页版本以 160 kbps 重新编码并移除封面元数据。转场约 470 KB、Flower Dance 约 588 KB，其余两首约 2–3 MB，按需加载与缓存。没有使用未提供的 Overture。

如需更换 Day 1 音乐，替换 `public/audio/rain.mp3` 或修改 `audio.tracks.day1.src` 即可。`scripts/import-rain.mjs` 记录提取来源与步骤；它会保护已经存在的根目录 `rain.mp3`，不会覆盖原文件。其他曲目和淡入淡出时长也可在婚礼配置修改。

## 星露谷素材来源

参考入口：[星露谷中文 Wiki](https://zh.stardewvalleywiki.com/Stardew_Valley_Wiki)。咖啡、啤酒、冰淇淋、鱼、花束、种子、金南瓜、鼓块、橡实、小鸡、祝尼魔图标下载到本地。

逐项来源在 `public/assets/pixel/sources.json`。游戏素材版权归 ConcernedApe；Wiki 文本许可不等同于游戏图片的许可。主图和音频为用户提供的素材。活动地图布局、网球图标和页面样式为本项目制作。

需要重新获取图标时：

```sh
node scripts/prepare-assets.mjs --wiki-only
```

## 验证

本地服务器运行时：

```sh
npm run test:browser
npx playwright install webkit
BROWSER_ENGINE=webkit npm run test:browser
node scripts/verify-audio.mjs
BROWSER_ENGINE=webkit node scripts/verify-audio.mjs
node scripts/verify-rain.mjs
BROWSER_ENGINE=webkit node scripts/verify-rain.mjs
node scripts/verify-revisions.mjs
BROWSER_ENGINE=webkit node scripts/verify-revisions.mjs
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-summary.mjs
```

Chromium 默认使用 macOS 已安装的 Google Chrome；其他机器可修改 `scripts/verify.mjs` 中的可执行路径，或安装 Playwright Chromium 并移除路径配置。可用 `PREVIEW_URL` 指定生产预览地址。

覆盖 375×812、390×844、430×932 与桌面 1440×1000，检查横向溢出、可见图片、资源错误、照片留位、地图链接、活动点选保存、默认静音、四段实际音频解码播放、关闭/恢复与减少动态效果。截图与报告输出到 `test-results/`。独立音频检查还覆盖启动中关闭音乐、文件加载失败后的重试，以及快速滚动时迟到的音频不会切走当前章节音乐。

浏览器模拟不等于真实微信。正式发送前仍需在 iPhone 微信、Safari 和 Android 微信中检查：首次开启音乐、切到后台再返回、网络较慢时的播放、地图能否正常打开。局域网 HTTP 上会使用复制地址的兼容方式；正式部署使用 HTTPS。

## GitHub Pages 自动部署

仓库：[Moreda313/MM_Wedding_Invitation](https://github.com/Moreda313/MM_Wedding_Invitation)。网站地址：<https://moreda313.github.io/MM_Wedding_Invitation/>。

`.github/workflows/deploy.yml` 在每次推送到 `main` 后自动安装依赖、构建并发布 `dist/`。仓库 Settings → Pages 的 Source 使用 **GitHub Actions**。构建与发布状态可以在仓库的 Actions 页面查看。

本地复现 GitHub Pages 的子路径：

```sh
npm run build -- --base=/MM_Wedding_Invitation/
npm run preview -- --base=/MM_Wedding_Invitation/
```

浏览器打开预览服务下的 `/MM_Wedding_Invitation/`。图片、图标、`srcset` 与音频通过 `src/lib/assetUrl.ts` 统一适配部署路径。配置中的 `/assets/...`、`/audio/...` 保持现有写法；外部 HTTPS 素材链接也可以直接使用。

CI 直接使用 `public/` 中已经优化好的素材，不读取本地原片，不需要重新下载 Wiki 素材或重新转码音频。

## 部署到腾讯云 CloudBase

1. 执行 `npm run build`。
2. 在已开通静态托管的 CloudBase 环境中，将 `dist/` 内的文件上传到托管根目录；首页为 `index.html`。
3. 用临时 HTTPS 域名在手机测试，确认后再绑定婚礼域名。
4. 页面为单页滚动结构、没有客户端路由。普通 `npm run build` 使用根路径，适合独立域名；GitHub 工作流单独指定仓库子路径。

## 仍待补充

- 至少 6 张故事照片、两天场地照片。
- 补充两天下午及第一天晚宴的具体钟点，并确认草坪是否需要单独定位。
- 如需更像本人的像素形象，再替换定制像素新人；当前使用提供的主图人物。
- 手机逐屏审阅后，调整开场滚动长度、转场节奏和照片构图。
