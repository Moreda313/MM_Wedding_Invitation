export type MemoryPhoto = {
  id: string; x: number; y: number; w: number; angle: number;
  ratio: string; fix: string; alt: string;
  pin?: string; position?: string; layer?: number;
};

// Approved preview layout. Only these eleven selected photos are published.
export const memoryWall = {
  title: "下一张，和你一起。",
  note: "把这次相聚，也留在照片里。",
  photos: [
    { id: "01", x: 23, y: 37, w: 201, angle: -6, ratio: "16/9", fix: "pin", pin: "#839474", alt: "海边喝饮料的合照" },
    { id: "02", x: 380, y: 47, w: 192, angle: -3, ratio: "16/9", fix: "tape", alt: "绿山与海岸前的合照" },
    { id: "03", x: 240, y: 22, w: 126, angle: 4, ratio: "3/4", fix: "pin", pin: "#c7a266", alt: "花丛旁的夜间合照" },
    { id: "04", x: 589, y: 36, w: 133, angle: 6, ratio: "3/4", fix: "pin", pin: "#87999b", alt: "草地上放彩色风筝" },
    { id: "15", x: 27, y: 226, w: 221, angle: 4, ratio: "16/9", fix: "tape tape-warm", alt: "树荫下并肩坐着，身后是山与城市" },
    { id: "16", x: 268, y: 239, w: 128, angle: -7, ratio: "4/5", position: "50% 85%", fix: "pin", pin: "#9aa27c", alt: "夕阳下靠在一起的近景" },
    { id: "18", x: 278, y: 429, w: 128, angle: 3, ratio: "4/5", position: "50% 60%", fix: "tape", alt: "木亭里相对而坐" },
    { id: "19", x: 420, y: 235, w: 247, angle: -4, ratio: "16/9", fix: "pin", pin: "#b07c6b", alt: "金色草地与秋日夕阳中的合照" },
    { id: "22", x: 30, y: 423, w: 220, angle: -5, ratio: "16/9", fix: "pin", pin: "#a39564", alt: "海边日落，笑容和举手比心" },
    { id: "24", x: 430, y: 427, w: 179, angle: 7, ratio: "16/9", fix: "tape tape-warm", alt: "蓝天海边的双人站姿合照" },
    { id: "25", x: 552, y: 492, w: 181, angle: -6, ratio: "16/9", fix: "pin", pin: "#839474", layer: 3, alt: "晴天沙滩上的合照" },
  ] as MemoryPhoto[],
};
