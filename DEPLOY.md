# 部署到公网

这个项目是纯静态网页，不需要服务器程序，也没有联机对战或玩家数据同步能力。部署后，你把网址发给别人，对方就能在自己的浏览器里游玩。

## 推荐方式一：GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `snake-10x10`。
2. 把本目录里的所有文件上传到仓库根目录。
3. 进入仓库的 `Settings` -> `Pages`。
4. `Build and deployment` 选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/root`，保存。
6. 等待部署完成后，GitHub 会给出一个公网网址。

## 推荐方式二：Netlify

1. 登录 Netlify。
2. 新建站点并选择手动上传。
3. 上传整个 `D:\.codex\snake-10x10` 文件夹。
4. 部署完成后，Netlify 会给出一个公网网址。

## 推荐方式三：Vercel

1. 登录 Vercel。
2. 新建项目并导入这个静态项目。
3. Framework Preset 选择 `Other`。
4. Build Command 留空，Output Directory 使用 `.`。
5. 部署完成后，Vercel 会给出一个公网网址。

## 注意

- 当前游戏记录保存在玩家自己的浏览器里，不会上传到服务器。
- 不同玩家之间不会共享历史最佳纪录。
- 如果以后需要全球排行榜、账号、房间或多人联机，就需要额外增加后端服务。
