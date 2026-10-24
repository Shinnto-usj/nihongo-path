# English course audio: sources and generation

This edition contains **85 fixed synthetic English audio clips**, generated on 2026-10-24 from the application's original public teaching text. They are neural speech synthesis, not human recordings. No learner microphone audio, private writing, profile or backup was used as input.

## Coverage and format

| Material | Clips | Text used for lookup |
| --- | ---: | --- |
| Listening scenes | 12 | The complete original `listening.script`, including textual speaker labels |
| Expression recall | 72 | Each chunk followed by its example: `${chunk.text}. ${chunk.example}` |
| Settings voice preview | 1 | The fixed public preview sentence |
| **Total** | **85** | NFKC normalization, collapsed whitespace and trimmed ends |

Speaker labels are retained in the lookup key but are not read aloud. Dialogue roles receive consistent voices within a scene: `af_heart` first, `am_michael` second, and `af_bella` when a third role is present. Monologues, expression cards and the settings sample use `af_heart`.

The MP3 files are mono, 24 kHz, 64 kbit/s. Speech was generated at model speed 1.0. The original generated samples total **1,029.045 seconds**; the MP3 containers total **1,033.968 seconds** including encoding padding. The 85 files occupy **8,288,064 bytes**. Playback speed is a separate browser control.

## Model and tool attribution

- **Kokoro-82M v1.0**, published by hexgrad. The publisher identifies its model weights as Apache-2.0: https://huggingface.co/hexgrad/Kokoro-82M
- **Kokoro 0.9.4** inference library, Apache-2.0: https://github.com/hexgrad/kokoro
- **Misaki 0.9.4** pronunciation frontend, Apache-2.0: https://github.com/hexgrad/misaki
- Official voice documentation: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
- English frontend model: spaCy `en_core_web_sm` 3.8.0, from its official release: https://github.com/explosion/spacy-models/releases/tag/en_core_web_sm-3.8.0

The model card provides its training-data attribution, including Koniwa and SIWIS materials. Those credits remain available at the model link above. This web application distributes its original course text and generated audio; it does not bundle model weights, an inference environment, third-party demonstration recordings or third-party transcript text. Keep the applicable upstream license notices if separately redistributing upstream software or weights.

The official v1.0 model-weight SHA-256 was verified before synthesis:

```text
496dba118d1a58f5f3db2efc88dbdc216e0483fc89fe6e47ee1f2c53f18ad1e4
```

Generation used CPU PyTorch 2.7.1, the official model configuration and published voice tensors. The build audit records source text, voice assignments, model-file and output-file hashes, durations, signal measurements and installed package versions. Model caches and generation environments are excluded from the public application.

## Delivery and verification

The hosted app plays fixed same-origin MP3 files referenced by `content/pronunciation.js`. The single-file edition embeds those same bytes as audio data URIs. Neither playback method sends learner text to a speech API. Unavailable fixed audio may fall back to a browser voice marked as local; the interface identifies the source actually used. Learner recording playback remains separate and uses local blobs.

All 85 MP3s were decoded without errors and checked against their generation hashes. Catalog tests verify all 85 expected public texts, present bounded MP3 files, no extra audio files, and consistency of the shared playback helper. Release tests build the real artifacts in a temporary checkout, check the exact public file list, verify every embedded audio payload against its source file, and recompute CSP hashes from the final embedded script and stylesheet.

These are integrity, coverage and playback checks. **The clips have not received independent human pronunciation review.** They do not establish human-like speech, accent authenticity or native-level proficiency. The model author notes that very short utterances can be less reliable. Use the linked human listening materials for additional accent, prosody and spontaneous-conversation exposure, and report any missing word, unusual stress or pronunciation that needs correction.
