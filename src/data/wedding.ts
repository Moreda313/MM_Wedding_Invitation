export type MusicScene = "day1" | "transition" | "day2" | "party" | "ending";
export type Photo = {
  src: string; alt: string; caption: string;
  srcSet?: { src: string; width: number }[];
  width?: number;
  height?: number;
};
export type WeddingDay = {
  id: string;
  label: string;
  title: string;
  date: string;
  weekday: string;
  city: string;
  venue: string;
  venueLabel: string;
  ceremonyVenue: string;
  mapLabel: string;
  address: string;
  mapUrl: string;
  note: string;
  schedule: { time: string; title: string; note?: string }[];
  venuePhoto: Photo;
};

export const wedding = {
  couple: { groom: "毛凌涛", bride: "陈婉梦", monogram: "M & M" },
  greeting: [
    { lines: ["Hi", "好久不见。"], note: "近来可好？", emoji: "👋", emojiLine: 0 },
    { lines: ["浪漫的人生时刻", "想和你分享。"], note: "", emoji: "💌", emojiLine: 1 },
    { lines: ["我们要", "结婚啦！"], note: "想请你来，和我们一起庆祝。", emoji: "🎉", emojiLine: 1 },
  ],
  intro: {
    label: "一封给你的邀请",
    dates: "2026.10.22 — 10.23",
  },
  day1: {
    id: "day1",
    label: "Day 1",
    title: "在花园里，一起见面。",
    date: "2026.10.22",
    weekday: "星期四",
    city: "建德",
    venue: "新安江雷迪森酒店",
    venueLabel: "晚宴地点",
    ceremonyVenue: "雷迪森酒店草坪",
    mapLabel: "打开地图",
    address: "建德市新安江街道南山路1号",
    mapUrl: "https://surl.amap.com/mzxjIZkp9A1",
    note: "想请你见证我们的婚礼，\n也想借这个机会，好好聚一聚。",
    schedule: [
      { time: "上午9:00", title: "接新娘" },
      { time: "下午14:00", title: "草坪婚礼", note: "雷迪森酒店草坪" },
      { time: "晚上17:30", title: "晚宴" },
    ],
    venuePhoto: {
      src: "/assets/photos/day1-place-6550e1f0-960.webp",
      srcSet: [640, 960, 1440].map((width) => ({ src: `/assets/photos/day1-place-6550e1f0-${width}.webp`, width })),
      width: 1440, height: 960,
      alt: "建德婚礼场地示意图：白色尖拱建筑前的白绿花艺、草坪花瓣步道和观礼席",
      caption: "雷迪森酒店草坪",
    },
  } satisfies WeddingDay,
  day2: {
    id: "day2",
    label: "Day 2",
    title: "第二天，遂昌见。",
    date: "2026.10.23",
    weekday: "星期五",
    city: "遂昌",
    venue: "华侨东方大酒店",
    venueLabel: "午宴地点",
    ceremonyVenue: "遂昌源口大草坪",
    mapLabel: "午宴酒店地图",
    address: "遂昌县牡丹亭中路8号（近太和路）",
    mapUrl: "https://surl.amap.com/dCdJgKy170lF",
    note: "来参加婚礼，\n也来和许久没见的朋友聚一聚。",
    schedule: [
      { time: "中午11:00", title: "午宴开始", note: "午宴后前往草坪" },
      {
        time: "下午14:00",
        title: "草坪婚礼与派对",
        note: "遂昌源口大草坪",
      },
    ],
    venuePhoto: {
      src: "/assets/photos/day2-place-ed78cf45-960.webp",
      srcSet: [640, 960, 1440].map((width) => ({ src: `/assets/photos/day2-place-ed78cf45-${width}.webp`, width })),
      width: 1440, height: 1080,
      alt: "遂昌婚礼场地示意图：秋日星露谷风格的花拱、木椅、花草和山景",
      caption: "遂昌源口大草坪",
    },
  } satisfies WeddingDay,
  hero: {
    together: "邀请你来参加我们的婚礼。",
    photoAlt: "毛凌涛与陈婉梦牵手微笑，新娘挥手，新郎举起捧花",
  },
  transition: {
    surprise: "One more thing…",
    title: ["人生，", "也可以是星露谷。"],
    after: "把日子，过成喜欢的游戏。",
    hint: "往下看看第二天的安排",
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
    eyebrow: "秋日 · 婚礼 · 老朋友",
    title: "欢迎来到\n我们的秋日小镇。",
    note: "喝杯咖啡，听听音乐，\n找朋友聊聊天。",
    sign: "毛凌涛 & 陈婉梦的婚礼",
  },
  party: {
    eyebrow: "小镇活动一览",
    title: "在一起，\n享受秋日时光。",
    selected: "已标记",
    unselected: "标记想玩",
    activities: [
      { id: "coffee", name: "喝杯咖啡", icon: "Coffee", x: 20, y: 22 },
      { id: "drink", name: "喝一杯", icon: "Beer", x: 75, y: 18 },
      { id: "icecream", name: "吃个冰淇淋", icon: "Ice_Cream", x: 48, y: 35 },
      { id: "fishing", name: "钓个盲盒", icon: "Sunfish", x: 16, y: 60 },
      { id: "tennis", name: "来挥一拍", icon: "tennis", x: 79, y: 56 },
      { id: "flowers", name: "做一束花", icon: "Bouquet", x: 50, y: 70 },
      { id: "seed", name: "把种子带回家", icon: "Mixed_Seeds", x: 22, y: 86 },
      { id: "music", name: "听现场音乐", icon: "Flute_Block", x: 73, y: 86 },
      {
        id: "lucky",
        name: "试试手气",
        icon: "Golden_Pumpkin",
        x: 49,
        y: 9,
      },
    ],
  },
  ending: {
    title: "带一份种子回家，\n让美好慢慢生长。",
    english: "See you there.",
    note: "到时候见！",
    top: "再看一遍",
  },
  summary: {
    title: "婚礼信息",
    enter: "查看时间与地点",
  },
  ui: {
    itinerary: "日程",
    navigate: "打开地图",
    copy: "复制地址",
    copied: "地址已复制",
    copyFailed: "请长按上方地址复制",
    venue: "婚礼场地",
    date: "婚礼日期",
    location: "婚礼地点",
    schedule: "当天安排",
    musicOn: "音乐已开",
    musicOff: "开启音乐",
    musicLoading: "音乐加载中",
    musicWaiting: "音乐待播放",
    musicBlocked: "音乐待播放",
    musicBlockedHint: "音乐待播放，轻触页面可播放；点击此按钮关闭音乐",
    musicError: "播放失败，点击重试",
    enableMusic: "开启音乐，继续看看",
    continue: "继续往下看",
    jumpDay1: "第一天 · 建德",
    jumpDay2: "第二天 · 遂昌",
    jumpSummary: "信息汇总",
  },
  audio: {
    fadeSeconds: 3,
    tracks: {
      day1: { src: "/audio/rain.mp3", title: "Rain · 秦基博", volume: 0.55 },
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
