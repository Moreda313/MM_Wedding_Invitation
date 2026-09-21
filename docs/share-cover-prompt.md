# 分享封面 v2

使用 imagegen 内置工具编辑 `cover.png`，不覆盖原图。输出已另存本地 `cover-share-v2.png`（原始素材不提交），通过 `scripts/prepare-share-cover.mjs` 生成公开 JPEG：`public/assets/share/wedding-cover-976137ba.jpg` 和相同内容的 `wedding-cover.jpg`。尺寸 1200×630，约 215 KiB。使用版本化地址作为 OG 图片，保留旧版文件以兼容旧分享。

最终提示词：

```text
Use case: precise-object-edit. Asset type: wedding invitation social sharing cover. Image 1 is the edit target. Edit this existing cover, preserving the recognizable composition, wedding couple and white-green garden on the left, central pixel transition, autumn Stardew-inspired pixel newlyweds, dog and cat on the right. Keep the natural ivory/moss/soft golden autumn palette and lighting. Produce a wide 1200:630 aspect ratio composition for a social card. Simplify ALL typography: remove all small lettering from the scene signs including Better Together, Good Food Good People Same Love, Coffee Cake Happiness, Two Days A Deeper Us, and remove the Garden Wedding arrow Stardew Autumn Party tagline. Remove these tiny signs or replace their writing with subtle leaf/heart ornaments, without adding text. Retain ONLY these three lines, centered in the middle safe area and highly legible at thumbnail size: 'M & M' (largest), 'Wedding Invitation' (second), '2026.10.22 — 2026.10.23' (third). Enlarge the date a little for readability. All three lines must be verbatim. Preserve the central calm ivory negative space, beautiful serif typography and soft natural light. Do not add people, objects, captions, tiny words, logos, borders or watermarks. Output a complete edited raster cover, not a browser mockup.
```
