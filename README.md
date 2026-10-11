# Conexuai 官网

静态站点，零构建：没有 npm、没有打包器，浏览器直接读这些 HTML。

```
python3 -m http.server 8788     # 在本目录起一个本地预览
```

- `index.html` 等五页为中文，`en/` 下为同样五页的英文版，改文案两边要一起改。
- `assets/` 是样式与图片；`functions/` 是 Cloudflare Pages Functions（表单与下载接口）。
- 主题默认跟随系统深浅；首页（`/` 与 `/en/`）有太阳/月亮切换与「中 / EN」切换，偏好记在本机浏览器（`assets/boot.js`），安全与隐私、内测协议两页（中英）沿用同一套页头与切换；申请、下载两页仍只跟随系统。
- 页面不加载任何外部字体或统计脚本：首页用的 Outfit / Geist Mono 是自托管拉丁子集（`assets/fonts/`，OFL 许可证随附），中文走系统字体。

*Conexuai · 封闭 Alpha 内测*
