export type MusicScene = "day1" | "transition" | "day2" | "party" | "ending";
export type Photo = { src: string; alt: string; caption: string };
export type WeddingDay = {
  id: string;
  label: string;
  title: string;
  date: string;
  weekday: string;
  city: string;
  venue: string;
  address: string;
  mapUrl: string;
  note: string;
  schedule: { time: string; title: string; note?: string }[];
  venuePhoto: Photo;
};

export const wedding = {
  couple: { groom: "毛凌涛", bride: "陈婉梦", monogram: "M & M" },
  greeting: [
    { lines: ["Hi，", "好久不见。"], note: "有些开心，想当面和你说。" },
    { lines: ["近来可好？"], note: "" },
    { lines: ["最近，我们在准备", "一件令人激动", "又开心的事。"], note: "" },
    { lines: ["想和你分享。"], note: "" },
    { lines: ["我们要", "结婚啦！"], note: "想请你来，和我们一起开心两天。" },
  ],
  intro: {
    label: "一封给你的邀请",
    scroll: "慢慢往下看",
    skip: "直接看邀请",
    dates: "2026.10.22 — 10.23",
  },
  day1: {
    id: "day1",
    label: "Day 1",
    title: "在花园里，说愿意。",
    date: "2026.10.22",
    weekday: "星期四",
    city: "建德",
    venue: "杭州新安雷迪森酒店",
    address: "建德市新安江街道南山路1号",
    mapUrl: "https://surl.amap.com/mzxjIZkp9A1",
    note: "不用太正式。\n来坐坐，听听音乐，和我们一起留下一个好日子。",
    schedule: [
      { time: "下午", title: "草坪婚礼" },
      { time: "晚上", title: "晚宴" },
    ],
    venuePhoto: {
      src: "",
      alt: "建德婚礼场地",
      caption: "白色、绿色，和刚刚好的阳光。",
    },
  } satisfies WeddingDay,
  day2: {
    id: "day2",
    label: "Day 2",
    title: "明天，去星露谷玩。",
    date: "2026.10.23",
    weekday: "星期五",
    city: "遂昌",
    venue: "华侨东方大酒店",
    address: "遂昌县牡丹亭中路8号（近太和路）",
    mapUrl: "https://surl.amap.com/dCdJgKy170lF",
    note: "一场秋日婚礼，\n也是和老朋友们相聚的好天气。",
    schedule: [
      { time: "11:00", title: "午宴开始", note: "午宴后前往草坪" },
      {
        time: "下午",
        title: "草坪婚礼与派对",
        note: "留一个下午，慢慢玩",
      },
    ],
    venuePhoto: {
      src: "",
      alt: "遂昌婚礼草坪",
      caption: "树林、远山，和一整个下午。",
    },
  } satisfies WeddingDay,
  hero: {
    eyebrow: "我们的人生，下一章",
    together: "邀请你，一起见证",
    photoAlt: "毛凌涛与陈婉梦牵手微笑，新娘挥手，新郎举起捧花",
  },
  story: {
    eyebrow: "关于我们",
    title: "把普通的日子，\n过成喜欢的样子。",
    note: "还有好多瞬间，想慢慢分享给你。",
    empty: "未完待续",
    photos: Array.from({ length: 6 }, (_, i) => ({
      src: "",
      alt: `我们的第 ${i + 1} 个瞬间`,
      caption: "",
    })) as Photo[],
  },
  transition: {
    before: "不过，故事还没有结束。",
    surprise: "One more thing…",
    surpriseNote: "还有一件开心的事。",
    title: ["一天，怎么够。", "明天，换个世界见。"],
    after: "把日子，过成喜欢的游戏。",
    hint: "继续下滑，走进另一个小世界",
    enter: "进入第二天",
  },
  pixel: {
    hero: "/assets/pixel/wedding-scene.webp",
    poster: "/assets/pixel/wedding-poster.webp",
    bride: "",
    groom: "",
    couple: "",
  },
  day2Intro: {
    eyebrow: "秋日 · 晴 · 宜相聚",
    title: "欢迎来到\n我们的秋日小镇。",
    note: "带上好心情就好，\n剩下的，交给这个下午。",
    sign: "毛凌涛 & 陈婉梦的小小婚礼",
  },
  party: {
    eyebrow: "今日小镇营业中",
    title: "没什么任务，\n开心就好。",
    note: "点一点，把想玩的事悄悄记下来。",
    selected: "已记下",
    unselected: "加入心愿",
    footer: "不赶进度，也不用全部打卡。",
    activities: [
      { id: "coffee", name: "喝杯咖啡", icon: "Coffee", x: 20, y: 22 },
      { id: "drink", name: "微醺小酒馆", icon: "Beer", x: 75, y: 18 },
      { id: "icecream", name: "吃个冰淇淋", icon: "Ice_Cream", x: 48, y: 35 },
      { id: "fishing", name: "钓一份惊喜", icon: "Sunfish", x: 16, y: 60 },
      { id: "tennis", name: "挥一拍网球", icon: "tennis", x: 79, y: 56 },
      { id: "flowers", name: "做一束花", icon: "Bouquet", x: 50, y: 70 },
      { id: "seed", name: "带颗种子回家", icon: "Mixed_Seeds", x: 22, y: 86 },
      { id: "music", name: "听现场音乐", icon: "Drum_Block", x: 73, y: 86 },
      {
        id: "lucky",
        name: "今天的幸运儿",
        icon: "Golden_Pumpkin",
        x: 49,
        y: 9,
      },
    ],
  },
  ending: {
    eyebrow: "天色慢慢暗下来",
    title: "把一颗种子带回家，\n让美好慢慢发芽。",
    english: "See you there.",
    note: "我们在这里，等你来。",
    top: "再看一遍",
  },
  ui: {
    itinerary: "日程",
    navigate: "打开地图",
    copy: "复制地址",
    copied: "地址已复制",
    copyFailed: "请长按上方地址复制",
    venue: "场地一瞥",
    date: "婚礼日期",
    location: "相聚地点",
    schedule: "当天安排",
    live: "现场音乐 · 与你相伴",
    musicOn: "音乐已开",
    musicOff: "开启音乐",
    musicLoading: "音乐准备中",
    musicWaiting: "音乐将在转场响起",
    musicError: "音乐未能播放，点击重试",
    enableMusic: "配上音乐，继续看看",
    continue: "继续往下看",
    jumpDay1: "第一天 · 建德",
    jumpDay2: "第二天 · 遂昌",
  },
  audio: {
    fadeSeconds: 3,
    tracks: {
      day1: { src: "", title: "Day 1 婚礼轻音乐", volume: 0.55 },
      transition: {
        src: "/audio/fall.mp3",
        title: "Fall (Ghost Synth)",
        volume: 0.5,
      },
      day2: {
        src: "/audio/flower-dance.mp3",
        title: "Flower Dance",
        volume: 0.52,
      },
      party: {
        src: "/audio/pelican-town.mp3",
        title: "Pelican Town",
        volume: 0.45,
      },
      ending: {
        src: "/audio/moonlight-jellies.mp3",
        title: "Dance Of The Moonlight Jellies",
        volume: 0.3,
      },
    },
  },
};
