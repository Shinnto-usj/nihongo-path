# 日々 · 日本語 — Nihongo Path

A Chinese-language Japanese learning workspace for complete beginners preparing for life in Japan. It supports a personal N1 goal with daily practice and separate evidence of progress.

## Use the application

**Portable application:** build with `npm run standalone`, then open `dist/Nihongo-Path.html` in a current browser. A prebuilt self-contained HTML is included in the user handoff.

**Online application:** the static build can be hosted on GitHub Pages. The public application contains general learning material; personal preferences and learning records stay in each browser. See [the publication guide](docs/publishing.md) for the exact release boundary.

Open **今日学习 → 开始我的第一课**. The first lesson introduces あ・い・う・え・お. In **学习设置**, adjust the daily time budget and optionally fill in the residence city and departure date. Neither city nor departure date is assumed.

The public version starts with **30 minutes/day** and no target date. Set your own target and daily budget in **学习设置**. These are scheduling choices, not promises of N1 proficiency. Stage check dates are recalculated from the plan's creation date and your target date; completing a date never changes your ability level.

## Included now

- **Daily workspace:** next unfinished lesson, due reviews, study budget, active days, and real recorded study time.
- **Kana practice:** 46 basic hiragana/katakana pairs, 25 voiced/semi-voiced pairs, and 33 common contracted combinations. Click to learn, hear a device voice, or take a randomized ten-question exercise.
- **24 original micro-lessons / 120 questions:** introductions, examples, multiple choice, typed answers, and 27 listening exercises. Full lessons require at least 80% independently correct to count as passed. Viewing a listening transcript marks the answer as assisted.
- **133 vocabulary cards:** introduced through actual study, scheduled with a transparent small interval algorithm. Again=10 minutes, Hard=1 day, Good follows 1/3/7/14/30/60/90 days, Easy advances two rungs. This is not FSRS or a proficiency model.
- **Persistent mistake practice:** independently incorrect or assisted answers appear in a separate queue; a subsequent independent correct answer resolves that item. This does not retroactively pass the original full lesson.
- **8 branching residence scenarios:** cafe, convenience store, directions, lodging, housing repair, clinic communication, municipal counter, and neighbors. These are authored dialogues, not a generative conversation service.
- **Speaking practice:** Japanese TTS uses only voices explicitly marked local by the browser. No remote voice fallback is allowed. Optional microphone recording requires a button click; collection stops when the page is hidden or the session closes. Recordings are temporary browser audio, not uploaded, transcribed, stored in backups, or assigned a pronunciation score.
- **Focus timer:** counts elapsed time while explicitly running, continues in the background for external study materials, and records notes. Pause it when leaving study. Ordinary page exit saves the current focus entry once.
- **Stage planning and evidence:** foundation→N5→N4→N3→N2→N1 checkpoints, official materials, in-course familiar-question samples, and separate external test records for vocabulary/grammar, reading, and listening raw percentages.
- **Persistence and portability:** local browser state, resumable unfinished lessons, validated JSON import/export, and ordinary cross-tab storage refresh.

## Educational scope

These 24 micro-lessons are a working initial practice library and stage introductions. They are **not a complete zero-to-N1 course, an official JLPT item bank, or a calibrated proficiency test**. N3–N1 items are introductory samples. An actual N1 goal needs a substantially larger curriculum, vocabulary, reading volume, natural audio, and repeated unfamiliar-material evaluation.

The app links to official **IRODORI**, **Marugoto**, **JLPT sample items**, and **JLPT Official Practice Workbooks** so the short interactive practice can sit alongside complete learning materials. Official questions and books are linked, not reproduced. The original content has been checked for structural and language errors, but it has not received independent human-teacher certification.

The JLPT evaluates language knowledge, reading, and listening; speaking for life in Japan has to be trained separately. Raw practice percentages are not converted into official scaled scores. Source details, staging decisions, and suggested checkpoints are in [docs/curriculum.md](docs/curriculum.md).

## Run locally

No third-party runtime packages, model API, API keys, or paid services are required.

```bash
npm test
npm run check
npm run build
npm run standalone
npm run preview
```

Open http://localhost:4173 in a browser. `npm run preview` uses Python 3's static HTTP server. Alternatively serve `dist/` with any static host. Do not open the source `index.html` through `file://`, because that source uses JavaScript modules. The generated **Nihongo-Path.html** is different: scripts, styles, and illustrations are inlined, and it can be opened as one file without a local server. Browser storage and audio permissions still depend on the browser; export progress regularly.

Requirements: Node.js 22 or newer, Python 3 only for the provided preview command, and a current browser with ES modules, dialog, localStorage, and Intl support. All application paths are relative, so the generated `dist/` directory can be hosted beneath a repository subpath.

### Build and content architecture

```text
index.html                 Accessible shell
styles.css                 Responsive paper/green/vermillion visual system
app.js                     Views, practice sessions, speech, recording, timer, imports
content/course.js          Original lessons, dialogues, resources, milestones
lib/engine.js              State validation, schedules, scoring, dates, daily plan
lib/kana.js                Kana pairs and sound notes
assets/                    Original SVG illustration and icon
scripts/build.mjs          Copy the exact static application to dist/
scripts/standalone.mjs     Create a self-contained distribution HTML
scripts/validate-content.mjs Structural and pedagogical contract checks
tests/                     Engine, curriculum, and lifecycle regression checks
docs/publishing.md         Public source and Pages release boundaries
```

To add a lesson, follow the existing content schema and run `npm run check` and `npm test`. Each question needs a unique ID, an answer, feedback, and any required passage context; randomly sampled questions must stand alone. Keep listening transcripts in `audio`, not `jp`. Resource levels are arrays of stage IDs or `all`; display labels are separate.

## Persistence and privacy

State is stored at `nihongo-path:v1`; unfinished lessons use `nihongo-path:active-session:v1` in the same browser. A regular JSON export contains profile preferences, course/card progress, daily totals, study notes, and assessment records; treat that backup as personal data. Clearing site data or switching device/browser does not transfer progress automatically. Export and import are the current transfer method.

There is **no cloud progress sync**, GitHub authentication, analytics SDK, or external research/model call in the application. Progress belongs to the browser origin. Development preview data and the published site's data are separate. Microphone samples remain temporary browser blobs. Japanese TTS is restricted using the browser's `localService` flag; this flag is not a network sandbox for the operating system's voice implementation.

The online document restricts scripts and styles to this site's files, blocks application network connections, and allows temporary `blob:` audio playback. The portable build hashes its exact embedded script and stylesheet. The two generated progress-bar style attributes are allowed; inline JavaScript handlers are blocked. These content policies do not protect against a compromised first-party release, device, browser, or extension, and a meta policy cannot set `frame-ancestors` or HTTP response headers.

Records and exported JSON are not encrypted by this application. Back up regularly and keep backups private. GitHub Pages logs visitor IP addresses for security; this application does not upload study history. Different project paths under the same GitHub Pages hostname share browser origin storage. Use a dedicated hostname when hosting other applications that should not share this boundary. See [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) and [Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).

The timer is a user-controlled elapsed-time record, not a measurement of attention. The cross-tab listener covers ordinary staggered writes; simultaneous conflicting edits across tabs are not a transactional database. A sudden browser/process crash can still lose an in-flight timer entry; completed learning records and explicitly exported backups are the stable checkpoints.

## Delivery and verification

Publish this application in its own repository with a fresh history. Include only the reviewed source file list. Do not transfer another repository's Git history, hosting identity, credentials, personal progress, or unrelated project files.

Automated checks cover learning-state validation, timezone/date handling, scheduling, completion rules, content correctness contracts, branching reachability, backup round trips, and browser API lifecycle edge cases using mocks. Browser QA covers the actual first lesson, interruption/resume, assisted listening, typed answers, result recording, review, branching dialogue, settings, and study records. See [docs/verification.md](docs/verification.md) for the verified scope and device-dependent limits.

Source commits and a successful local build do not by themselves prove publication. Verify the Pages deployment result and the rendered HTTPS page before reporting an online URL as live.
