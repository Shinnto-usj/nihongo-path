# English Atelier verification

## Automated checks

| Suite | Passing cases | Scope |
| --- | ---: | --- |
| Learning engine | 20 | Validated state, timezone boundaries, review schedules, pass/assistance rules, retained samples, explicit budgets, backup round trips and malformed-input rejection |
| Expression curriculum | 9 | 24 lessons, 72 unique questions/chunks, six tracks, meaningful feedback, output models, independent baseline contracts |
| Listening and speaking | 5 | 12 complete listening scripts and 36 questions, 12 speaking tasks, six repeatable benchmarks, official source contracts |
| Application lifecycle | 17 | First answer/one completion, dirty storage conflicts, import failures, microphone cancellation races, recording cleanup, elapsed time, voice selection, static audio, stale callbacks and old speech-rate preservation |
| Release packaging | 6 | Exact runtime/audio whitelist, private-canary exclusion, hosted CSP, exact standalone hashes and audio bytes, no outgoing API/eval, empty public initial state |
| Audio catalog | 3 | All 85 fixed spoken texts, bounded present MP3s without extra files, identical shared playback helper |
| **Total** | **60** | Built-in Node.js tests |

The repository root runs all Japanese and English suites together: 141 cases across 12 files. Both apps build without installing runtime dependencies.

## Audio verification

85 files cover 12 listening scripts, 72 expressions with their original examples, and one settings preview. Full FFmpeg decoding succeeded for all 85 files, and their SHA-256 hashes matched the generation audit. MP3s contain 24 kHz mono audio. The voices are pre-generated Kokoro neural speech, clearly labelled synthetic; this work does not claim human recording or a human pronunciation audit.

The standalone builder initializes all 85 manifest sources to embedded audio data URIs. The release test compares their decoded bytes with the source MP3s and verifies the CSP hash against the final script, not an earlier template. The website only loads those fixed MP3s from its own origin; personal practice text is not sent to a synthesis service.

## Observed browser preview

- The desktop dashboard, lesson library, review queue, listening scenes, source links and settings rendered.
- A complete first lesson accepted three answers and an original writing sample, displayed 3/3, recorded a pass and placed its three chunks into review.
- The writing sample and progress persisted across refresh.
- A review card could be revealed, played using its pre-generated audio, stopped and graded, advancing to the next card.
- A complete dialogue clip reached the playing state with the synthetic source label; revealing the transcript retained that playback source and marked the exercise as assisted.
- Source links lead to primary publishers, not embedded third-party players.

## Scope and limits

The baseline is a small contextual sample plus an original writing sample. It does not infer a CEFR level, TOEFL score, native status or a calibrated gain. Open outputs use reference answers and self-review criteria; there is no automatic AI correction, speech recognition or pronunciation score.

Microphone timing and cleanup were verified with controlled mocks. The cloud-browser checks did not request real microphone access or certify device-specific recording quality. Subjective naturalness and all possible accents are not established by successful decoding or playback-start events. Natural speech remains available through official publisher links for listening and imitation.

Progress stays at `english-atelier:v1` in the current browser; temporary recordings are excluded from backups. Same-origin paths are separate learning workspaces, not separate security origins. The app has no account-based sync; backups are transferred through explicit export/import.

The actual HTTPS release result will be recorded after deployment; passing local checks alone does not establish publication.
