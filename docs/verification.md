# Verification record

This record distinguishes automated checks, earlier browser observations, and checks still required for the public release. It is not a certification of language proficiency or evidence that publication has completed.

## Current automated checks

The current automated test results are:

| Suite | Passing cases | Main coverage |
| --- | ---: | --- |
| Learning engine | 28 | Timezones and date boundaries; streaks; due-card filtering; lapse and reentry schedules; failed and repeated lessons; the completion boundary; actual elapsed time and counts; import/export validation; unsafe input rejection; optional personal target dates and relative checkpoints |
| Content | 11 | Answer validity; unique IDs; listening transcript separation; standalone question context; scenario reachability and successful paths; official HTTPS resource mappings; vocabulary consistency; checkpoint references |
| Application lifecycle | 17 | Duplicate and late microphone requests; recorder cleanup; overlapping speech initialization; exactly-once persistence; result timing; cross-tab refresh; failed reattempt wording; wrong-question backup and resolution; focus restoration |
| Public release | 6 | Build whitelist and private canaries; exact standalone CSP hashes; preceding hosted CSP; restricted network and script execution; generic initial state |
| **Total** | **62** | Tests run with the built-in Node.js test runner |

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

- The earlier cloud test browser had no installed Japanese speech voice. The application reported this condition and provided text-assisted practice and links to official recordings. Actual voice quality and device-specific availability still require a capable device.
- Microphone concurrency and track cleanup were tested with platform mocks. A real microphone was not requested during browser QA; real recording and playback require separate device verification after microphone permission is granted.
- No account-based cloud synchronization is implemented. Export/import is the current cross-device mechanism. The storage listener handles ordinary cross-tab updates, but is not a transactional guarantee for simultaneous conflicting writes.
- Ordinary focus exit saves once. A browser crash or operating-system termination is outside that guarantee.
- Official materials link to primary publishers. Some direct JLPT page fetches timed out during source checking; official-domain search supplied their descriptions. Link purposes were cross-checked, not their permanent future availability.
- Original exercises introduce study stages. They have not been statistically calibrated or certified by a human examiner. App percentages are not official JLPT scores, and course completion does not establish an N1 level.

## Publication status

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
