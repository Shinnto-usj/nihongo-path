# Verification record

This record distinguishes automated checks, browser observations, and explicit publication results. Only the dated publication sections assert that a particular build was deployed; none of these checks certify language proficiency or subjective pronunciation quality.

## Current automated checks

The current automated test results are:

| Suite | Passing cases | Main coverage |
| --- | ---: | --- |
| Learning engine | 28 | Timezones and date boundaries; streaks; due-card filtering; lapse and reentry schedules; failed and repeated lessons; the completion boundary; actual elapsed time and counts; import/export validation; unsafe input rejection; optional personal target dates and relative checkpoints |
| Content | 11 | Answer validity; unique IDs; listening transcript separation; standalone question context; scenario reachability and successful paths; official HTTPS resource mappings; vocabulary consistency; checkpoint references |
| Application lifecycle | 29 | Duplicate and late microphone requests; recorder cleanup; overlapping speech initialization; exactly-once persistence; result timing; cross-tab refresh; failed reattempt wording; wrong-question backup and resolution; focus restoration |
| Public release | 6 | Build whitelist and private canaries; exact standalone CSP hashes; preceding hosted CSP; restricted network and script execution; generic initial state |
| Audio playback | 11 | Same-origin and embedded audio, local fallback, stale callbacks, interruption, rate bounds |
| Audio content | 4 | All 493 Japanese text keys, native priority, 389 real MP3 assets, bounded paths and frame validation |
| **Japanese total** | **89** | Tests run with the built-in Node.js test runner |
| **English companion** | **62** | See [English verification](../english/docs/verification.md) |
| **Combined total** | **151** | 12 test files; all pass |

Static build and JavaScript syntax checks have also passed. These checks do not require external services, credentials, model calls, or real microphone access.

Content inventory remains 24 lessons, 120 questions, 27 listening questions, 133 vocabulary cards, 8 scenarios, 33 scenario nodes, 9 official resources, and 6 relative checkpoints. Kana inventory is 104 paired entries: 46 basic, 25 voiced or semi-voiced, and 33 contracted.

The public initial state has no target date, a 30-minute daily budget, and no injected learning achievements. Personal settings and progress belong to the current browser. Checkpoint fractions allocate review dates within a personal plan; they do not predict proficiency or the time needed to attain a JLPT level.

## Browser observations from the earlier development build

The following interactions were observed in an isolated desktop preview before the final public-release cleanup. They are useful regression evidence, but **do not replace browser QA of the latest public build**:

1. The dashboard rendered with zero genuine initial progress and no injected demo achievements.
2. The first lesson could be started, left partway through, reloaded, resumed, and completed.
3. Listening text stayed hidden until help was requested. A correct response after revealing the transcript was recorded as assisted, rather than independently correct.
4. Typed answers accepted case and whitespace normalization, including ` U ` for `u`.
5. Finishing the lesson selected the next lesson, created the actual learned vocabulary cards, and retained an assisted or wrong question in a separate queue.
6. A review card could be flipped and rated; the due count changed after the session was closed.
7. The cafe scenario handled an unsuitable reply, contextual feedback, retry, a drink choice, dining preference, payment expression, and the ending. This was a teaching simulation with no actual purchase.
8. Changing the daily budget, saving, and reloading preserved the new setting and earlier practice progress.
9. A focus timer retained its material reference, note, and actual elapsed time after reload.
10. A clearly labeled QA assessment retained separate raw-percentage fields.
11. Progress could be exported to JSON and replaced with a validated clean QA snapshot through the actual file chooser and replacement confirmation.
12. The desktop layout was inspected for clipping, spacing, typography, contrast, and hierarchy. Responsive CSS was reviewed; physical mobile-browser verification was not performed.

QA learning records were isolated from the source package and are not part of the public initial state. Old personal target dates and conversation-specific labels have been removed from this record and from the public teaching examples.

## Latest public-build browser QA

The final multi-file build and standalone HTML were both opened in the managed desktop preview with their actual CSP active. The application rendered and responded to its navigation. A saved target was cleared through the settings form, the budget was set to 30 minutes, and the settings persisted. The standalone dashboard then showed an empty target prompt, a 30-minute budget, and zero initial practice records. Earlier saved v1 settings also loaded without migration errors. Relative checkpoint dates were visibly calculated from the stored personal target.

The latest checks did not repeat unchanged lesson flows already covered above. The actual GitHub Pages HTTPS origin has now also passed the checks below.

## Content security policy

The multi-file application declares an HTML CSP that restricts scripts to local site resources. The standalone builder generates SHA-256 CSP hashes for its embedded script and stylesheet. The standalone output therefore does not rely on allowing arbitrary inline scripts.

The actual hosted document was inspected and contains the expected HTML CSP. The live page loaded its modules and assets and supported lesson interaction and saved settings under that policy. This verifies the HTML declaration and exercised behavior, not additional HTTP response headers, operating-system isolation, or the absence of all possible vulnerabilities.

## Verified limits

- The earlier browser had no installed local Japanese voice. Version 1.2 plays the shipped audio without requiring a device voice; strictly local TTS remains a fallback. Automated decode checks and browser playback state do not establish subjective naturalness or certify Japanese pitch accent.
- Microphone concurrency and track cleanup were tested with platform mocks. A real microphone was not requested during browser QA; real recording and playback require separate device verification after microphone permission is granted.
- No account-based cloud synchronization is implemented. Export/import is the current cross-device mechanism. The storage listener handles ordinary cross-tab updates, but is not a transactional guarantee for simultaneous conflicting writes.
- Ordinary focus exit saves once. A browser crash or operating-system termination is outside that guarantee.
- Official materials link to primary publishers. Some direct JLPT page fetches timed out during source checking; official-domain search supplied their descriptions. Link purposes were cross-checked, not their permanent future availability.
- Original exercises introduce study stages. They have not been statistically calibrated or certified by a human examiner. App percentages are not official JLPT scores, and course completion does not establish an N1 level.

## First published version (historical evidence)

**Live and verified:** [https://shinnto-usj.github.io/nihongo-path/](https://shinnto-usj.github.io/nihongo-path/)

- Application source commit: `9a4f6b063ff983f5fcbafbb84cdcf89a12cfc022`.
- Published `gh-pages` commit: `a4d3e271db2e711776255c873060db7c1de513a9`.
- [GitHub Pages run 40107956815](https://github.com/Shinnto-usj/nihongo-path/actions/runs/40107956815) completed successfully; build, deployment, and status reporting all succeeded.
- All nine files in the remote static tree were compared by Git blob SHA with the reviewed local build and matched exactly. No hosting identity, private history, credentials, progress backups, documentation, or test files entered the static branch.
- The live HTTPS app rendered its zero-progress dashboard, opened the first lesson and quiz, and showed the correct feedback for a submitted answer.
- A temporary target and daily budget were saved, then verified after reloading the actual hosted page.
- The hosted import flow accepted a validated clean QA snapshot with a replacement confirmation. QA data and the suspended lesson were cleared. The final browser state has no target, a 30-minute budget, and no learned records.
- The final application page was visually inspected. Real device speech and microphone playback remain subject to the stated device-verification limits.

`main` contains the source and documentation; `gh-pages` contains only the static release. Subsequent documentation-only commits do not change the published application. See [Publishing instructions](publishing.md) for the exact whitelist and update method.


## Version 1.2 audio upgrade and English companion

The Japanese catalog now has 493 normalized public text keys, including both kana scripts, every course `jp`/`audio` field, and the settings preview. It resolves to **389 distinct MP3s**: **34 native recordings** and **355 VOICEVOX Nemo neural clips**. The native files take priority only for their corresponding 68 hiragana/katakana keys. Contracted kana and phrases retain their own synthetic source labels. All 389 files completed full FFmpeg decoding without an error; exact coverage and MP3 frame checks also pass.

The English companion includes 85 fixed Kokoro neural clips. Combined builds contain **494 files**: 19 named runtime files, one `.nojekyll`, and 474 referenced MP3s. No synthesis models, dependencies, local backups or generation caches enter either public tree. The release tests insert private canaries into runtime directories to verify this boundary.

The playback helper permits only same-origin audio, or bounded embedded audio in the standalone build. It never constructs a media URL from a learner's input. Closing a practice, changing exercises, hiding the document, leaving the page or starting recording cancels prior playback and prevents late callbacks from restarting it. New defaults use 1.0; explicitly saved prior rates remain unchanged. Original-speed and slow controls can be used directly for listening.

In the actual browser preview, a native あ recording and an English expression clip reached the playing state under the hosted CSP; a complete English listening scene also played, and its current source label survived revealing the transcript. Review grading advanced the queue normally. These are observed UI and playback-start checks, not an assertion that a human audited every pronunciation.

Updated standalone builds embed their course MP3s and use final script/style CSP hashes. Their verified sizes are approximately 7.58 MB for Japanese and 11.39 MB for English. The actual HTTPS release has now been verified as described below.


## Verified version 1.2 publication

- Application source commit: `64786f4a50e767810fe5779f3b1851873edd30dc`.
- Pages commit: `7ee12d90720b2fcabb9dcb5701386338448bfda0`.
- [Pages run 40113458729](https://github.com/Shinnto-usj/nihongo-path/actions/runs/40113458729) completed successfully; its deployment log identifies https://shinnto-usj.github.io/nihongo-path/.
- All 524 source-tree files and all 494 static-tree files were compared by Git blob SHA with the reviewed local release maps and matched exactly, including every MP3.
- The actual Japanese HTTPS page rendered the new English link, labelled audio and original/slow controls. A VOICEVOX Nemo phrase and the native あ recording both reached the playing state, with the correct distinct source labels and original-speed indication.
- The actual English HTTPS entry at https://shinnto-usj.github.io/nihongo-path/english/ rendered its empty initial dashboard, 24-unit catalog and 30-minute budget. A full dialogue reached the playing state as labelled, pre-generated synthetic audio under the expected hosted CSP.
- No graded learning activity or microphone recording was created during this release's live-site check. The English page was left on its empty dashboard; existing Japanese settings were preserved. Screenshots of the actual live result were captured.
- Portable HTML copies with embedded audio were saved successfully. File and website progress are separate browser contexts; explicit export/import transfers records between them.

Documentation-only updates after the application commit do not change this Pages release.

## Independent acceptance of PR 1 — 2026-11-01

The review started from PR #1 at `fce1f4469cbeec28f6e74d5a3b9c7546195d032b`, against `main` at `ef4797d8a37c1a74acb6fdfc7d9141dc87a725d8`. Independent reviews covered material matching, recording ownership and lifecycle, learning records, and release boundaries. Existing source research and the 144-case candidate evidence were reused; the browser checks below fill the missing acceptance work.

### Findings corrected before release

- The price comparison remains in `n5-02`, which contains the actual price question. It was removed from the convenience-store scene, which does not contain that question. The repetition card moved from the city-office scene to the convenience-store scene, where its requested phrase is available. All eight Japanese cards and five English cards remain.
- A Japanese recorder stopped by the browser now restores its start/stop buttons only for the current recording and session. Empty recording data no longer produces a false ready-to-play sample. Old callbacks still cannot change a newer recording.
- Firefox 142 was observed to produce Ogg/Opus data while exposing an empty recorder MIME string. English recording downloads now use `.ogg` for the actual Ogg chunk type; MP4 and WebM behavior is retained.
- An existing Japanese recovery gap was repaired: unreadable progress previously fell back to an empty in-memory state that could later overwrite the saved original. The app now pauses ordinary writes, preserves both the original progress and suspended-lesson storage, offers a verbatim original download, and resumes saving only after a valid backup is explicitly confirmed and successfully written. Valid v1 records are not migrated or rewritten on load. A second independent review checked this repair.
- The source whitelist now explicitly includes the original human-speech review document. The static publishing whitelist is unchanged.

### Automated evidence

`npm run check` and `npm test` passed on the final application changes. The 12 existing test files now define **151 cases: 89 Japanese and 62 English**. The seven additional regressions beyond the initial candidate cover automatic/empty recording completion, protected original records and confirmed recovery, and Firefox Ogg naming. The release suites also execute both static and portable builders in disposable checkouts and check exact CSP hashes, audio identity, and exclusion of private canaries. The combined production builder was run separately, and runtime source/build bytes were compared before publication.

### Actual browser evidence

All browser records and downloaded samples in this review were isolated QA data. No existing learner profile, personal microphone, or personal recording was accessed.

| Environment | Observed scope | Limit |
| --- | --- | --- |
| Chromium 141.0.7390.37, Linux | 14 acceptance groups passed: eight Japanese cards and official links; both shipped-audio players; real MediaRecorder capture with a browser test device; Japanese rerender/next-turn retention, automatic stop and cleanup; English listening completion, replay and download; old v1 records, literal HTML-like text and JSON backup safety; rejected/cancelled import; protected original export and confirmed recovery; desktop and 390px phone-width UI; no page exceptions or outgoing application requests | The audio source was a test device. This does not validate a physical microphone or human pronunciation. |
| Firefox 142.0.1, Linux | The final build produced an Ogg/Opus recording, stopped all tracks, replayed the sample to completion and downloaded a real `.ogg` file with the `OggS` header. Old and new written samples survived refresh. A missing Linux audio-output sink was isolated from the application and resolved for the test with a null output containing no hardware input; shipped MP3 playback then also succeeded. | This tests the Firefox engine and generated test audio, not a user's audio hardware. |
| WebKit 26.0, Linux | Both application views, shipped MP3 playback, saved listening text, refresh retention and the unsupported-recording message were checked without page exceptions. This build does not expose MediaRecorder; the app made no microphone request and did not invent a recording. | Linux Playwright WebKit is not a physical Safari/macOS/iOS test. Native Safari microphone and MP4 recording remain unverified. |

The Chromium recording tests used actual browser MediaRecorder events and playable Blob data, in addition to the existing controlled race tests. Japanese samples survived translation changes, answer feedback, and continued dialogue; closing the exercise revoked the sample, and a new exercise did not reuse it. English listening saved exactly one practice record and retained the audio on its result page for explicit download.

Previously saved settings, an older speech rate, achievements, review cards, drafts and written samples were retained. English output containing literal HTML markup rendered as text. Exported learning JSON contained the written records and no recording Blob or audio URL; Japanese and English storage keys did not overwrite one another. A damaged Japanese original survived a settings save, downloaded byte-for-byte, survived cancelled import, and was replaced only through the explicit valid-import confirmation.

The new practice panels were visually inspected at phone width, including their expanded instructions and official-source links. This is responsive-browser evidence, not physical mobile-device certification.

### Boundaries retained

The fixed audio catalog and its source labels are unchanged. Third-party audio stays on the publishers' sites; new practice cards are links and original exercise instructions. Both hosted CSPs still prohibit application connections and frames and allow media only from the application origin and temporary recording Blobs. No audio, screenshots, test logs, personal progress, or browser profiles are added to the public release beyond the existing fixed course MP3 catalog.

**Human pronunciation listening review and real-microphone checks remain incomplete.** Successful decoding, recording, playback and task completion do not establish improved learner pronunciation, native-like prosody, or language proficiency. The warning about unreviewed synthetic sarcasm intonation in English `listen-06` remains visible.
