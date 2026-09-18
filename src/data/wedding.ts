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
    { lines: ["Hi，", "好久不见。"], note: "近来可好？" },
    { lines: ["有个好消息，", "想和你分享。"], note: "" },
    { lines: ["我们要", "结婚啦！"], note: "想请你来，和我们一起庆祝。" },
  ],
  intro: {
    label: "一封给你的邀请",
    dates: "2026.10.22 — 10.23",
  },
  day1: {
    id: "day1",
    label: "Day 1",
    title: "草坪上的婚礼",
    date: "2026.10.22",
    weekday: "星期四",
    city: "建德",
    venue: "杭州新安雷迪森酒店",
    address: "建德市新安江街道南山路1号",
    mapUrl: "https://surl.amap.com/mzxjIZkp9A1",
    note: "想请你见证我们的婚礼，\n也想借这个机会，好好聚一聚。",
    schedule: [
      { time: "下午", title: "草坪婚礼" },
      { time: "晚上", title: "晚宴" },
    ],
    venuePhoto: {
      src: "",
      alt: "建德婚礼场地",
      caption: "建德 · 草坪仪式场地",
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
    address: "遂昌县牡丹亭中路8号（近太和路）",
    mapUrl: "https://surl.amap.com/dCdJgKy170lF",
    note: "来参加婚礼，\n也来和许久没见的朋友聚一聚。",
    schedule: [
      { time: "11:00", title: "午宴开始", note: "午宴后前往草坪" },
      {
        time: "下午",
        title: "草坪婚礼与派对",
        note: "仪式之后，一起玩",
      },
    ],
    venuePhoto: {
      src: "",
      alt: "遂昌婚礼草坪",
      caption: "遂昌 · 草坪仪式与派对场地",
    },
  } satisfies WeddingDay,
  hero: {
    together: "邀请你来参加我们的婚礼。",
    photoAlt: "毛凌涛与陈婉梦牵手微笑，新娘挥手，新郎举起捧花",
  },
  story: {
    title: "我们的照片",
    photos: Array.from({ length: 6 }, (_, i) => ({
      src: "",
      alt: `我们的第 ${i + 1} 个瞬间`,
      caption: "",
    })) as Photo[],
  },
  transition: {
    before: "对了，还有个小彩蛋。",
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
    title: "想玩什么，\n随你挑。",
    note: "点选感兴趣的活动，给自己做个标记。",
    selected: "已标记",
    unselected: "标记想玩",
    footer: "玩几项都好，不用全部打卡。",
    activities: [
      { id: "coffee", name: "喝杯咖啡", icon: "Coffee", x: 20, y: 22 },
      { id: "drink", name: "喝一杯", icon: "Beer", x: 75, y: 18 },
      { id: "icecream", name: "吃个冰淇淋", icon: "Ice_Cream", x: 48, y: 35 },
      { id: "fishing", name: "钓个盲盒", icon: "Sunfish", x: 16, y: 60 },
      { id: "tennis", name: "来挥一拍", icon: "tennis", x: 79, y: 56 },
      { id: "flowers", name: "做一束花", icon: "Bouquet", x: 50, y: 70 },
      { id: "seed", name: "把种子带回家", icon: "Mixed_Seeds", x: 22, y: 86 },
      { id: "music", name: "听现场音乐", icon: "Drum_Block", x: 73, y: 86 },
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
    title: "带一份种子回家，\n种出来了，记得发照片给我们。",
    english: "See you there.",
    note: "到时候见！",
    top: "再看一遍",
  },
  summary: {
    title: "婚礼信息",
    note: "下午仪式及第一天晚宴的具体钟点待补充。",
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
    live: "现场音乐",
    musicOn: "音乐已开",
    musicOff: "开启音乐",
    musicLoading: "音乐加载中",
    musicWaiting: "音乐待播放",
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
