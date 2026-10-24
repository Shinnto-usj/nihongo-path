# 公开发布说明

当前状态：**已上线，并已核验实际 HTTPS 页面**。

在线入口：[https://shinnto-usj.github.io/nihongo-path/](https://shinnto-usj.github.io/nihongo-path/)

GitHub 已自动识别发布分支并完成部署。首次发布记录：[pages build and deployment](https://github.com/Shinnto-usj/nihongo-path/actions/runs/40107956815)。

## 独立仓库与干净历史

公开版使用一个新建的独立 GitHub 仓库，从已审查的源文件建立首次提交。不得复制旧仓库的 `.git`、远端配置或提交历史，也不得把其他项目整体复制进新仓库。

源文件进入新仓库前，采用以下**显式白名单**，仅复制这些文件：

| 类别 | 允许进入 `main` 的文件 |
| --- | --- |
| 应用入口 | `index.html`、`styles.css`、`app.js` |
| 运行模块 | `lib/engine.js`、`lib/kana.js`、`content/course.js` |
| 静态素材 | `assets/icon.svg`、`assets/journey.svg` |
| 项目说明 | `package.json`、`README.md`、`.gitignore` |
| 文档 | `docs/curriculum.md`、`docs/verification.md`、`docs/publishing.md` |
| 构建与检查 | `scripts/build.mjs`、`scripts/standalone.mjs`、`scripts/validate-content.mjs` |
| 回归测试 | `tests/engine.test.mjs`、`tests/content.test.mjs`、`tests/app-lifecycle.test.mjs`、`tests/public-release.test.mjs` |

白名单以外的文件不随源代码发布。尤其排除：旧 `.git`、`.openai`、hosting identity、凭据或 token、环境变量文件、浏览器学习记录及导出的进度 JSON、QA 快照、临时日志、截图、打包归档和本机路径信息。发布不需要向用户索取或要求手工粘贴 PAT。

后续如确需加入新文件，应先检查内容，再显式更新白名单。不得用复制整个工作目录的方式扩大公开范围。

## 源码与发布分支

`main` 保存上述源码、文档、构建脚本和测试。`gh-pages` 只保存构建后的静态网站，两个分支的用途分开。

静态构建命令：

```bash
npm run check
npm test
npm run build
```

`scripts/build.mjs` 会清理并重新生成 `dist/`。发布到 `gh-pages` **根目录**的内容仅有以下六项以及 `.nojekyll`：

| 发布项 | 用途 |
| --- | --- |
| `index.html` | 站点入口 |
| `styles.css` | 页面样式 |
| `app.js` | 应用交互 |
| `lib/` | 学习引擎与假名数据 |
| `content/` | 课程与场景 |
| `assets/` | 本地静态素材 |
| `.nojekyll` | 静态发布标记 |

不要在发布分支根目录再包一层 `dist/`。`main` 的文档、测试、历史配置以及个人进度不进入 `gh-pages`。单文件版 `Nihongo-Path.html` 是独立分发产物，不属于此 Pages 发布清单。

网站运行只需要浏览器，不依赖本机常驻服务、模型 API key 或手工维护的 PAT。构建使用 Node.js；已经构建好的文件可由 GitHub Pages 直接托管。

## GitHub Pages 配置与实际验收

完成仓库和分支准备后，在仓库的 **Settings → Pages** 中选择：

- Source：`Deploy from a branch`。
- Branch：`gh-pages`。
- Folder：`/ (root)`。

保存设置后，等待 GitHub 给出发布结果和实际站点地址。应从 Pages 页面或发布结果中取得最终 HTTPS URL，不把推测出来的地址当作上线证据。

只有满足以下条件，发布状态才可改为已上线：

1. GitHub 的发布结果显示完成。
2. 实际 HTTPS URL 能打开，页面和本地脚本、样式、课程资源正常加载。
3. 在该站点地址下验证首次打开、开始一课、保存设置和重新加载等主要路径。
4. 将实际地址、验证结果和未验证的设备能力补入验证记录。

仓库创建成功、分支推送成功或构建通过，均不能单独替代站点 URL 的实际验收。

## 公开版初始状态与个人数据

公开版默认**不设置目标日期**，每日学习预算为 **30 分钟**，初始学习记录为空。学习者自行填写目标日和旅居信息，个人设置及练习记录保存在当前浏览器；源码和静态发布包不包含这些数据。

阶段检查点按首次创建计划日到个人目标日的比例安排复盘。比例只分配检查时间，不预测学习速度、达到等级所需时长或达标概率。最后的检查日由个人设置决定。

当前版本没有账号云同步。跨设备迁移采用进度导出与导入；导出的 JSON 是个人备份，不应提交到公开仓库。

## 内容安全策略与分发边界

多文件网页已在 HTML 中声明内容安全策略，脚本从本站加载；单文件构建器对内嵌脚本和样式生成对应的 SHA-256 CSP hash。外部学习材料以普通链接提供，应用不需要远程代码依赖。

已在实际 HTTPS 页面的 DOM 中核对上述 HTML CSP，并验证页面、答题、设置保存及刷新恢复正常。未把这份 meta 策略当作已设置额外 HTTP 安全响应头；浏览器/系统语音的实现边界仍按 README 说明。
