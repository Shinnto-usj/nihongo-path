# 公开发布说明

日语入口：https://shinnto-usj.github.io/nihongo-path/

英语入口：https://shinnto-usj.github.io/nihongo-path/english/

两套应用共用本仓库的 GitHub Pages 发布分支，使用各自的学习记录键。首次发布记录为 [Pages run 40107956815](https://github.com/Shinnto-usj/nihongo-path/actions/runs/40107956815)。最新版本的实际验证范围见 [verification](verification.md)。

## 发布边界

`main` 保存审查后的源代码、文档、测试和固定课程音频。`gh-pages` 只保存真实构建产物。不要把整个工作目录复制进任何分支；不导入其他仓库的历史。

允许进入 `main` 的源文件范围如下。音频文件必须同时存在于当前音频清单，并通过内容检查；目录名不代表允许递归复制目录内任意文件。

| 范围 | 明确允许的文件 |
| --- | --- |
| 日语运行文件 | `index.html`、`styles.css`、`app.js`、`lib/engine.js`、`lib/kana.js`、`lib/pronunciation.js`、`content/course.js`、`content/pronunciation.js`、`assets/icon.svg`、`assets/journey.svg` |
| 日语素材证据 | `content/native-pronunciation.js`、`docs/audio-sources.md` |
| 日语项目说明 | `package.json`、`README.md`、`.gitignore`、`docs/curriculum.md`、`docs/verification.md`、`docs/publishing.md` |
| 日语构建与检查 | `scripts/build.mjs`、`scripts/standalone.mjs`、`scripts/validate-content.mjs` |
| 日语回归测试 | `tests/engine.test.mjs`、`tests/content.test.mjs`、`tests/app-lifecycle.test.mjs`、`tests/public-release.test.mjs`、`tests/pronunciation.test.mjs`、`tests/audio-content.test.mjs` |
| 英语运行文件 | `english/index.html`、`english/styles.css`、`english/app.js`、`english/content/course.js`、`english/content/studio.js`、`english/content/pronunciation.js`、`english/lib/engine.js`、`english/lib/pronunciation.js`、`english/assets/icon.svg` |
| 英语说明与构建 | `english/package.json`、`english/README.md`、`english/scripts/build.mjs`、`english/scripts/standalone.mjs`、`english/docs/curriculum.md`、`english/docs/sources.md`、`english/docs/audio-sources.md`、`english/docs/verification.md` |
| 英语回归测试 | `english/tests/engine.test.mjs`、`english/tests/content.test.mjs`、`english/tests/studio.test.mjs`、`english/tests/app-lifecycle.test.mjs`、`english/tests/release.test.mjs`、`english/tests/audio-content.test.mjs` |
| 固定课程音频 | 两份 `content/pronunciation.js` 中 `src` 引用的 `assets/audio/*.mp3`，分别相对于各应用根目录 |

始终排除：旧 Git 配置、hosting identity、凭据、环境变量、个人进度 JSON、QA 记录或截图、临时日志、模型权重、语音生成环境、缓存、原始下载包和本机路径。

## 构建与发布

```sh
npm run check
npm test
npm run build
```

根构建器清空 `dist/`，只复制上述 10 个日语运行文件、9 个英语运行文件、两份清单引用的 MP3 和根目录 `.nojekyll`。根构建器不会递归复制源目录。音频路径限于应用自身 `assets/audio/` 下的普通 MP3 文件；未引用的文件不进入发布包。

把 `dist/` 的内容放在 `gh-pages` 根目录，保留 `english/` 子目录。不要再包一层 `dist/`。文档、测试、模型和个人记录不进入此分支。单文件 HTML 是另行分发的便携版本，也不进入 Pages 分支。

现有 Pages 配置使用 `Deploy from a branch`、`gh-pages`、`/ (root)`。后续发布不需要新增账号权限、API key 或手工粘贴 PAT。写入分支时检查当前提交，按预期 SHA 更新，避免覆盖他人的新修改。

## 音频、数据与内容安全策略

内置课程音频随网站从同一来源加载，网页不调用语音合成服务，也不上传学习者输入。在线 CSP 仅允许本站脚本/样式、本站音频与浏览器临时录音；`connect-src` 保持关闭。单文件版嵌入 MP3，并对最终内嵌脚本与样式生成精确 SHA-256 CSP hash。

真人假名录音、VOICEVOX Nemo 日语合成、Kokoro 英语合成分别标注来源。完整条款和署名见两份 audio-sources 文档。不要把合成音频宣传为真人，也不要将音频生成模型或下载缓存混入网站。

个人设置、旅居信息、学习笔记和练习记录由学习者在浏览器中填写，不写入公开源码。日语默认目标日为空；两套应用默认预算均为30分钟，初始进度为空。两条路径使用不同 storage key，但共享 GitHub Pages hostname 的浏览器 origin，并非独立的安全隔离域。

## 实际验收

发布提交和本地构建通过不等于已上线。应核对 GitHub Pages run 成功、实际 HTTPS 页面渲染、两套应用入口、音频加载及学习记录行为。将证据与设备限制写入验证记录。

HTML meta CSP 不等于额外 HTTP 响应头或操作系统隔离。实际麦克风、设备本地备用声线及主观发音自然度需要对应设备与人工试听验证；自动化测试不能替代这些验证。
