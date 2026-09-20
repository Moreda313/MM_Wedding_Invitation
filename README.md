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

婚礼文案、姓名、日期、酒店、导航地址与音乐路径集中在 `src/data/wedding.ts`；照片墙选片、文案、位置和裁剪集中在 `src/data/memory-wall.ts`。

```text
src/
  data/wedding.ts               婚礼配置、文案和素材路径
  sections/GreetingSequence.tsx 滚动问候
  sections/DayOne.tsx           真实婚纱照与第一天信息
  sections/WorldTransition.tsx  真实照片 → 逐级像素化 → 星露谷场景
  sections/DayTwo.tsx           第二天主图、日程和可点选的活动地图
  sections/Ending.tsx           像素夕阳和结尾
  sections/MemoryWall.tsx       已确认的 11 张合照，秋日像素留言板
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
- 2026.10.22，建德·新安江雷迪森酒店，新安江街道南山路1号。
- 2026.10.23，遂昌·华侨东方大酒店，牡丹亭中路8号（近太和路）。
- 两处高德导航链接与复制地址按钮。
- Day 1：上午9:00 接新娘，下午14:00 雷迪森酒店草坪婚礼，晚上17:30 晚宴。Day 2：中午11:00 华侨东方大酒店午宴，下午14:00 遂昌源口大草坪婚礼与派对。统一采用“时段 + 24 小时钟点”的写法，正文与汇总页共用日程数据；遂昌地图按钮明确为“午宴酒店地图”，草坪导航待补充，不复用酒店定位。

开场三屏：问候与近况 → 浪漫的人生时刻，想和你分享 → 我们要结婚啦。新句子用 0.85 秒淡入（延迟 0.08 秒），旧句子用 0.32 秒退出；停在任意位置后仍完全清晰。滚动长度由 320svh 缩短到 260svh，实际滚动行程减少约 27%，无滚动锁定；减少动态效果时顺序阅读。“近来可好？”为 22–28px，其余开场小字为 17px（桌面 19px）。

开场中文采用系统无衬线大字；Hi 使用本地托管的 Great Vibes 花体子集（仅 H、i，约 6.7 KB），许可见 `public/assets/fonts/GreatVibes-OFL.txt`，不在运行时请求 Google Fonts。音乐开关从开场起可见，便于随时关闭默认音乐；M&M 与底部导航仍在婚纱照进入视口后出现。隐藏控件设置 inert / aria-hidden。支持回滚、直达章节与减少动态效果。

开场三屏分别点缀 👋、💌、🎉；星露谷手捧花仅出现在第三屏“我们要结婚啦”。Day 2 转场直接用 “One more thing…” 引导，像素化时展示“人生，也可以是星露谷。”，保留“把日子，过成喜欢的游戏。”作为副文案，也可直接点击“进入第二天”像素按钮。

夕阳结尾之后增加独立“婚礼信息”汇总页（`#info-summary`），共用 `day1` / `day2` 配置生成日期、星期、城市、酒店、完整地址及日程，不维护第二套数据。每一天提供地图和复制地址按钮；底部导航增加“信息汇总”，结尾也有入口。该页保持结尾音乐，不自动开启音频；信息不依赖滚动显现动画，适合反复查看、截图保存。两天的日程钟点已补齐，不再展示时间待补充提示。

## 配色与视觉边界

`src/styles.scss` 的 `:root` 集中定义两天共用的 Ivory、Moss、Sage，以及 Garden / Autumn 配色。Day 1 为暖白与苔绿，重要按钮统一 `#3F5844`，婚纱照仅叠加轻薄的 ivory / sage 渐变，不加粉米色滤镜。衬线字体从婚礼正文开始出现。

Day 2 使用 `#F1E7D4` 米杏底与 `#584437` 正文，卡片和像素主图边缘保持米白，绿与木色连接两天；橙、金盏黄、浆果红、湖蓝只用于树木、游戏图标及摊位细节。设计比例目标为 Day 1：75% 中性 / 20% 绿 / 5% 暖色；Day 2：55% 中性 / 20% 绿与木 / 20% 橙黄 / 5% 浆果与蓝（不对原始照片做像素面积限制）。禁止大面积纯红、酒红或橙红。

活动地图沿用原布局：咖啡木色、冰淇淋与花束浆果色、钓鱼湖蓝、网球苔绿、种子金盏黄等，统一米白标签，通过像素边线和选中勾区分。转场采用白绿 → golden hour → 秋日米杏的纵向渐变；夕阳结尾之后接紧凑照片墙，婚礼信息汇总仍是最后一页。

## 补充照片

原始 ZIP 和 PNG 不会被修改。已有婚纱照生成 640、960、1440 三档 WebP，质量设为 86；手机通过 `srcset` 选择适合的尺寸。星露谷图裁出花架、新人与小动物，保留原图的完整网页副本。

原来的六个空白照片框已移除。正式照片墙使用用户确认的 01、02、03、04、15、16、18、19、22、24、25，共 11 张，放在 `#ending` 与 `#info-summary` 之间，锚点为 `#memory-wall`，继续播放结尾音乐。

保留已确认的图钉、胶带、白边、轻微旋转和星露谷点缀；文案为“下一张，和你一起。把这次相聚，也留在照片里。”。390px 手机上墙体约高 280px。16、18 号通过 CSS 做 4:5 展示裁剪，其他照片保留原比例。墙体样式限定在 `MemoryWall.scss` 的组件作用域内，不影响活动地图。

`public/assets/photos/wall/` 只包含获准发布的 11 张 480 像素长边 WebP，合计约 342 KB，移除 EXIF / GPS，滚动接近结尾时才加载。其余 14 张候选、所有 JPEG 大图和选片预览放在被 Git 忽略的 `photo-review/`，不上传。原 ZIP 仍不动。

本地工作流程：`node scripts/prepare-wall-photos.mjs` 生成 25 张本地候选；`node scripts/preview-photo-wall.mjs` 生成独立样稿；确认后执行 `node scripts/publish-wall-assets.mjs`，只复制上述 11 张到正式素材目录。正式布局以后以 `src/data/memory-wall.ts` 为准。

两处场地已接入用户生成的 `day1_place.png` 与 `day2_place.png`。场地图紧跟标题，图下注明“婚礼场地”和具体草坪名，然后呈现日期、酒店和日程；移除信息卡的“现场音乐”字段，不设大图链接。执行 `node scripts/prepare-venues.mjs` 生成 640、960、1440 宽的 WebP（质量 88），完整保留原图构图（Day 1 为 3:2，Day 2 为 4:3），手机通过 srcset 按需加载。原始 PNG 不覆盖且不提交到仓库。配置支持 src、srcSet、width、height；有实际场地照片后可替换。`pixel.bride`、`pixel.groom`、`pixel.couple` 继续预留定制像素人物。

两天的场地图均按源文件内容生成版本号，避免浏览器复用旧 URL 缓存。Day 1 新图为白色尖拱与白绿花艺场景，地址为 `day1-place-6550e1f0-{640,960,1440}.webp`；Day 2 保持 `day2-place-ed78cf45-{640,960,1440}.webp`。只更新一天时运行 `node scripts/prepare-venues.mjs --day=1` 或 `--day=2`；替换原图后须同步配置中的文件名前缀及尺寸。

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

音乐偏好默认开启，加载页面时尝试播放。浏览器允许时直接播放；若浏览器要求用户手势，界面显示“音乐待播放”，在真实触碰、点击或键盘操作时重试，不伪装成已播放。仅滚动事件不被当成播放授权。用户点击开关关闭后，页面交互、滚动、切换章节都不会重新开启；关闭偏好保存在当前浏览器会话内，刷新同样尊重关闭选择。

Day 1 播放 Rain。音乐由当前阅读章节决定，向上滚动也会返回对应曲目，不要求宾客停留固定时长。快速跨章节时以最后到达的章节为准。音乐开关从第一屏起可用，播放失败时提供重试。

使用 Web Audio 的 GainNode 做约 3 秒淡入淡出，避免依赖 iOS 对 HTMLAudioElement.volume 的支持。Flower Dance、Pelican Town 与结尾音乐保留完整曲目并循环；结尾的目标音量降低。切到后台时挂起音频，返回时尝试恢复；失败时保留重试入口。

Rain 从用户指定的 [Bilibili 视频 BV1at411L7Px](https://www.bilibili.com/video/BV1at411L7Px/) 提取，完整时长约 7 分 34 秒。根目录 `rain.mp3` 为较高质量的完整文件；`public/audio/rain.mp3` 为 128 kbps 的完整网页版本，约 6.9 MiB。Day 1 使用流式媒体播放并通过 Web Audio 淡入淡出，不等待整首下载和解码；默认播放会产生音频请求，有关闭偏好的会话不主动请求音频。

用户提供的其余原始 MP3 保留在根目录，网页版本以 160 kbps 重新编码并移除封面元数据。转场约 470 KB、Flower Dance 约 588 KB，其余两首约 2–3 MB，按需加载与缓存。没有使用未提供的 Overture。

如需更换 Day 1 音乐，替换 `public/audio/rain.mp3` 或修改 `audio.tracks.day1.src` 即可。`scripts/import-rain.mjs` 记录提取来源与步骤；它会保护已经存在的根目录 `rain.mp3`，不会覆盖原文件。其他曲目和淡入淡出时长也可在婚礼配置修改。

## 星露谷素材来源

参考入口：[星露谷中文 Wiki](https://zh.stardewvalleywiki.com/Stardew_Valley_Wiki)。咖啡、啤酒、冰淇淋、鱼、花束、种子、金南瓜、鼓块、橡实、小鸡、祝尼魔图标下载到本地。

活动区文案为“在一起，享受秋日时光。”。地图用秋季枫树、橡树、南瓜、蔓越莓、榛子、苹果、葡萄、鸡油菌、玫瑰仙子、小鸡和祝尼魔组合成小景，配合 CSS 木桥、篱笆、草丛和落叶；装饰层不接收点击，音乐摊位使用长笛块（Flute Block）。种子寄语为“带一份种子回家，让美好慢慢生长。”，搭配混合种子与星之果实（Stardrop）。秋日新增图片合计约 10 KB，执行 `node scripts/prepare-autumn.mjs` 可重建；秋树仅裁出原季节图中的秋季列，保留透明背景与原始像素。

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
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-autoplay.mjs
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-polish.mjs
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-autumn.mjs
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-memory-wall.mjs
PREVIEW_URL=http://127.0.0.1:5173/ node scripts/verify-venues.mjs
```

Chromium 默认使用 macOS 已安装的 Google Chrome；其他机器可修改 `scripts/verify.mjs` 中的可执行路径，或安装 Playwright Chromium 并移除路径配置。可用 `PREVIEW_URL` 指定生产预览地址。

覆盖 320×568、375×812、390×844、430×932 与桌面 1440×1000，检查横向溢出、场地图与花体、资源错误、11 张选片、照片墙大小与加载时机、地图链接、活动点选保存、五段音乐播放、关闭/恢复与减少动态效果。`verify-memory-wall.mjs` 另检查三档 Day 2 图片与当前原图逐字节相符、只发布确认照片、无 EXIF 元数据。原有手动开启场景通过 `muted-session.mjs` 设置宾客已关闭音乐的会话；独立 autoplay 检查覆盖真正允许自动播放、模拟拦截后手势解锁、启动中关闭及刷新后的关闭偏好。其他音频检查覆盖失败重试和快速滚动时的音频竞争。截图与报告输出到 `test-results/`。

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

- 照片墙已使用确认的 11 张合照；两天已有场地示意图，可再补充实际场地照片。
- 补充遂昌源口大草坪的导航链接；两天日程时间已齐。
- 如需更像本人的像素形象，再替换定制像素新人；当前使用提供的主图人物。
- 手机逐屏审阅后，调整开场滚动长度、转场节奏和照片构图。
