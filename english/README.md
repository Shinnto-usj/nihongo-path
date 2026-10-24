# English Atelier · 英语表达练习室

A daily, browser-local practice studio for advanced English learners: clear ideas, natural phrasing, register, listening, and confident interaction.

**Online:** https://shinnto-usj.github.io/nihongo-path/english/

## Start

1. Open **建立我的起点** for eight contextual judgments and an original writing sample. This is a repeatable starting point, not a CEFR placement test.
2. Choose a daily budget and focus in **学习设置**. The default is 30 minutes; research, conversation, or writing changes the recommended lesson order.
3. Practice recall, an expression lesson, then one spoken or written output. Compare your work with an annotated model and checklist.
4. Save samples, use real human speech through the external resource links, and compare repeated tasks over time.
5. Export a progress backup regularly. Imports replace the English records in the current browser after confirmation.

## Included

- 24 original expression lessons across six tracks: precision, register, flow, stance, interaction, story.
- 72 contextual expression questions and 72 reusable chunks.
- 12 original listening scenes with 36 questions, transcript assistance flags, and noticing notes.
- 12 speaking tasks, six repeatable benchmark tasks, a timer, temporary local recording, and manual self-ratings.
- An eight-question baseline with a writing sample; no inferred language level or native score.
- Six verified official external resources. Publisher media and transcripts are linked, not copied or embedded.
- A transparent spaced-recall queue; local writing drafts and retained practice samples.

The built-in scenes and expression examples use **pre-generated Kokoro neural speech**, with distinct dialogue voices. These are synthetic voices, not natural human recordings. Audio is hosted alongside the app, is labelled at playback, and requires no model call or API key. Only explicitly local English device voices are used if a clip cannot play. See [audio sources](docs/audio-sources.md). The output tasks have reference models and self-review criteria, not automated AI feedback or pronunciation scoring. Completing this collection does not certify a CEFR level or native-like command.

## Data and media

No account, token, backend, analytics, third-party runtime, model call, transcription, or upload is used. Runtime CSP closes outgoing connections and restricts scripts to app files. Fallback English voices must be marked `localService === true` by the browser; this flag is not an OS network guarantee.

Microphone access requires a user click and browser permission. Recording stops when the document is hidden, never automatically resumes, and is capped at three minutes. A recording is a temporary Blob; download it before leaving the practice. It is not included in JSON backups.

English progress uses `english-atelier:v1`, distinct from the Japanese app's key. Both apps share the same GitHub Pages origin; separate paths and keys are organizational boundaries, not origin isolation. Personal records and exported backups are not encrypted by the application. Clearing site data removes local progress. Existing malformed records are not silently overwritten; write failures and cross-tab conflicts are surfaced.

## Build and check

Node 22 or newer; no dependencies to install.

```sh
npm run check
npm test
npm run build
npm run standalone
```

`build` emits nine named runtime files, `.nojekyll`, and only the MP3s referenced by the audio manifest. `standalone` emits `dist/English-Atelier.html`, with embedded course audio and final script and stylesheet hashes in its CSP. The standalone file and hosted website have separate browser storage contexts; use export/import to transfer progress.

The repository root build also includes this app under `dist/english/`; the Japanese root remains the existing entry. See [curriculum](docs/curriculum.md), [sources](docs/sources.md), and [verification](docs/verification.md) for scope and validation.
