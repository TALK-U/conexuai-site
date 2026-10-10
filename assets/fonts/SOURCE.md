# 字体来源（首页用 Outfit / Geist Mono）

本目录下以下六个文件**原样取自 npm 上 Fontsource 发布的包，没有做任何转换、裁剪或重新子集化**——
拉丁子集是包里本来就切好的 `latin` 分片。其余文件（ConexuaiSans-*）不在本说明范围内。

| 本目录文件 | 包与版本 | 包内路径 | SHA-256 |
|---|---|---|---|
| outfit-latin-400-normal.woff2 | @fontsource/outfit@5.3.0 | files/outfit-latin-400-normal.woff2 | 71F028FD2349990B3F8AA643ABE767E82E0F596BE407AE66F0004FF164121BDB |
| outfit-latin-600-normal.woff2 | @fontsource/outfit@5.3.0 | files/outfit-latin-600-normal.woff2 | 8CFE15C2C6DE6EF8EFFF3EEDBD52A383AC9EF23D6C23F6CD9F9B838F5F37DC36 |
| outfit-latin-700-normal.woff2 | @fontsource/outfit@5.3.0 | files/outfit-latin-700-normal.woff2 | 5D5E3734089A74707292CE8A3E186DEF34CD63E33879F9AC3689A8D8DA9D0706 |
| geist-mono-latin-400-normal.woff2 | @fontsource/geist-mono@5.3.0 | files/geist-mono-latin-400-normal.woff2 | 3F98383B122FE015A48536CD4A1CDA855A201718923FFE74931A01597107B9B5 |
| OFL-Outfit.txt | @fontsource/outfit@5.3.0 | LICENSE | 0E5FCEF5D93BFCAE273C11C00F0BB453D3B5491860E1AC8B658767B7577C938F |
| OFL-GeistMono.txt | @fontsource/geist-mono@5.3.0 | LICENSE | CC815ED4FC045F0E991ABB10395B7932BD028C6A067DEB13316D6002105074E6 |

## 包本身

| 包 | tarball | npm integrity | tarball SHA-256 |
|---|---|---|---|
| @fontsource/outfit@5.3.0 | https://registry.npmjs.org/@fontsource/outfit/-/outfit-5.3.0.tgz | sha512-0AVHzTTVJSxWDOxPKSfMeHhZeBFDU3cmgrcOb76ZEyhGo0+xgyG3GsLF3h9+X8w0IX7G4jzjJgFQEBiWdX6VgA== | 1060497F324868B0A2173B6834248D48859FAAC5664184EC4C15AEE0586FAD8D |
| @fontsource/geist-mono@5.3.0 | https://registry.npmjs.org/@fontsource/geist-mono/-/geist-mono-5.3.0.tgz | sha512-UtJ1BBBCVpMYdIcW7nEB45UAoAw5M53ZXs2t0ciPW+IokuAAIc56M8+kW5tXbRJCTpDw4XTtU7proT6NdQAHTg== | 1388EA1CC6F02BA10BE011352D0C7CABBC29B59E587EAA9938DC63187B4A9169 |

两个包的 `metadata.json` 都写明上游为 https://github.com/google/fonts ，许可 OFL-1.1；
Outfit 版权头指向 Outfitio/Outfit-Fonts（字体版本 v15），Geist Mono 指向 vercel/geist-font（字体版本 v6）。

## 复核办法

```
npm pack @fontsource/outfit@5.3.0 @fontsource/geist-mono@5.3.0
tar xzf fontsource-outfit-5.3.0.tgz      # 解出 package/
# 逐个对比：cmp package/files/outfit-latin-400-normal.woff2 <本目录同名文件>
```

## 字体内部名表（fontTools 4.66.1 读取）

| 文件 | name ID 1（family） | ID 2 | ID 5（version） | OS/2 usWeightClass | 字形数 |
|---|---|---|---|---|---|
| outfit-latin-400-normal.woff2 | Outfit Thin | Regular | Version 1.100;gftools[0.9.27] | 400 | 247 |
| outfit-latin-600-normal.woff2 | Outfit Thin SemiBold | Regular | Version 1.100;gftools[0.9.27] | 600 | 249 |
| outfit-latin-700-normal.woff2 | Outfit Thin | Bold | Version 1.100;gftools[0.9.27] | 700 | 249 |
| geist-mono-latin-400-normal.woff2 | Geist Mono | Regular | Version 1.701 | 400 | 264 |

Outfit 三件内部 family 名带「Thin」：Fontsource 从可变字体切静态字重时沿用了默认实例的名字，
字重以 usWeightClass 为准（400/600/700 与文件名一致）。页面不依赖内部名——`home.css` 的
`@font-face` 显式指定 family 与 weight。
