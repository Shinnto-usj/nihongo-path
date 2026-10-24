/**
 * Playback of pre-generated, first-party course audio with a local-only fallback.
 * The manifest is an imported JS object, never fetched. Its keys contain public
 * course text; this module never constructs a network URL from spoken text.
 *
 * Manifest: {schemaVersion: 1, label?: string, entries: {
 *   [normalizePronunciationText(text)]: './assets/audio/name.mp3' | {src, label?}
 * }}
 *
 * const player = createPronunciationPlayer({manifest, baseURL: document.baseURI,
 *   stopFallback: () => window.speechSynthesis?.cancel(), onStatus});
 * player.play(text, {rate, fallback: async ({text, rate, isCurrent}) => {
 *   // Select only a language-matching voice with localService === true.
 *   // Recheck isCurrent() after every await and before calling synth.speak().
 *   // Return false if unavailable; otherwise start the local utterance.
 * }});
 * player.stop(); // close, navigation, hidden page, or microphone start
 *
 * play() resolves when playback starts, fallback completes its startup, or the
 * request is cancelled. A later media error can still invoke the guarded
 * fallback once. onStatus reports those later transitions. No event asserts
 * that synthesized audio is a human recording or certifies pronunciation.
 */

export function normalizePronunciationText(text) {
  return String(text ?? '').normalize('NFKC').replace(/\s+/gu, ' ').trim();
}

function validRate(rate) {
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0.4 || rate > 1.5) {
    throw new Error('Pronunciation rate must be between 0.4 and 1.5.');
  }
  return rate;
}

function audioURL(source, baseURL) {
  if (typeof source !== 'string' || !source || /[\u0000-\u001f\u007f]/u.test(source)) return null;
  // Standalone builds may embed only bounded audio bytes from the same trusted
  // manifest. No HTML/SVG data URL, arbitrary media type, or URL parameter is
  // accepted. The 10 MB limit applies to decoded bytes, per clip.
  if (source.startsWith('data:')) {
    const prefix = /^data:audio\/(?:mpeg|ogg|wav|mp4);base64,/u.exec(source)?.[0];
    if (!prefix) return null;
    const payload = source.slice(prefix.length), limit = 10_000_000;
    if (!payload || payload.length > Math.ceil(limit / 3) * 4 || payload.length % 4 !== 0
      || !/^[A-Za-z0-9+/]+={0,2}$/u.test(payload)) return null;
    const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
    if (payload.length / 4 * 3 - padding > limit) return null;
    return source;
  }
  try {
    const base = new URL(baseURL), resolved = new URL(source, base);
    if (!['http:', 'https:', 'file:'].includes(base.protocol) || resolved.protocol !== base.protocol
      || resolved.origin !== base.origin || resolved.username || resolved.password
      || resolved.search || resolved.hash) return null;
    // File previews may use adjacent assets, but may not redirect to a network
    // host. HTTP(S) playback stays on exactly the site's origin.
    if (base.protocol === 'file:' && resolved.host !== base.host) return null;
    return resolved.href;
  } catch { return null; }
}

export function createPronunciationPlayer({
  manifest = { schemaVersion: 1, entries: {} },
  baseURL = globalThis.document?.baseURI,
  createAudio = () => new globalThis.Audio(),
  isHidden = () => globalThis.document?.hidden === true,
  onStatus = () => {},
  stopFallback = () => {},
  playTimeoutMs = 8_000,
} = {}) {
  if (!manifest || manifest.schemaVersion !== 1 || !manifest.entries
    || typeof manifest.entries !== 'object' || Array.isArray(manifest.entries)) {
    throw new Error('Invalid pronunciation manifest.');
  }
  if (!Number.isFinite(playTimeoutMs) || playTimeoutMs < 1 || playTimeoutMs > 60_000) {
    throw new Error('Invalid pronunciation loading timeout.');
  }
  const entries = new Map();
  for (const [rawText, value] of Object.entries(manifest.entries)) {
    const key = normalizePronunciationText(rawText);
    const entry = typeof value === 'string' ? { src: value } : value;
    if (!key || !entry || typeof entry.src !== 'string') throw new Error('Invalid pronunciation manifest entry.');
    const previous = entries.get(key);
    if (previous && previous.src !== entry.src) throw new Error('Conflicting normalized pronunciation text.');
    entries.set(key, { src: entry.src, label: String(entry.label || manifest.label || '预生成 AI 合成语音') });
  }

  let current = null, generation = 0, defaultRate = 1;
  const emit = (state, details = {}) => {
    // A presentation callback must not strand an active audio resource.
    try { onStatus({ state, ...details }); } catch {}
  };
  const isCurrent = request => current === request && request.generation === generation && !request.cancelled && !isHidden();
  const settle = (request, result) => {
    if (request.settled) return;
    request.settled = true; request.resolve(result);
  };
  const clearLoading = request => {
    if (request.timer !== null) clearTimeout(request.timer);
    request.timer = null;
  };
  const disposeAudio = audio => {
    if (!audio) return;
    audio.onplaying = null; audio.onended = null; audio.onerror = null;
    try { audio.pause(); } catch {}
    try { audio.removeAttribute('src'); audio.load(); } catch {}
  };
  const release = request => {
    clearLoading(request);
    const audio = request.audio; request.audio = null;
    disposeAudio(audio);
  };
  const obsolete = request => {
    if (isCurrent(request)) return false;
    release(request); request.cancelled = true;
    if (current === request) { current = null; emit('cancelled', { source: request.source }); }
    settle(request, { status: 'cancelled' });
    return true;
  };

  function cancelActive(report) {
    const previous = current; current = null; generation += 1;
    if (previous) {
      previous.cancelled = true; release(previous);
      settle(previous, { status: 'cancelled' });
      if (report) emit('cancelled', { source: previous.source });
    }
    try { stopFallback(); } catch {}
  }
  function stop() { cancelActive(true); }

  async function useFallback(request, reason) {
    if (obsolete(request) || request.fallbackStarted) return;
    request.fallbackStarted = true; request.source = 'local'; release(request);
    if (typeof request.fallback !== 'function') {
      emit('unavailable', { source: 'local', reason });
      current = null; settle(request, { status: 'unavailable', reason }); return;
    }
    emit('fallback', { source: 'local', reason, label: '设备本地合成语音' });
    try {
      const available = await request.fallback({ text: request.text, rate: request.rate,
        isCurrent: () => isCurrent(request), reason });
      if (obsolete(request)) return;
      if (available === false) {
        emit('unavailable', { source: 'local', reason });
        current = null; settle(request, { status: 'unavailable', reason });
      } else settle(request, { status: 'fallback', source: 'local', reason });
    } catch {
      if (obsolete(request)) return;
      try { stopFallback(); } catch {}
      emit('unavailable', { source: 'local', reason: 'fallback-failed' });
      current = null; settle(request, { status: 'unavailable', reason: 'fallback-failed' });
    }
  }

  function play(text, { rate = defaultRate, fallback } = {}) {
    validRate(rate);
    cancelActive(false);
    const key = normalizePronunciationText(text);
    return new Promise(resolve => {
      const request = { generation, text: String(text ?? ''), rate, fallback, resolve,
        cancelled: false, settled: false, fallbackStarted: false, playing: false,
        audio: null, timer: null, source: 'asset' };
      current = request;
      if (obsolete(request)) return;
      if (!key) { current = null; settle(request, { status: 'unavailable', reason: 'empty-text' }); return; }
      const entry = entries.get(key);
      if (!entry) { void useFallback(request, 'asset-missing'); return; }
      const source = audioURL(entry.src, baseURL);
      if (!source) { void useFallback(request, 'asset-url-rejected'); return; }

      const started = () => {
        if (obsolete(request) || request.fallbackStarted || request.playing) return;
        request.playing = true; clearLoading(request);
        emit('playing', { source: 'asset', label: entry.label, rate: request.rate });
        settle(request, { status: 'playing', source: 'asset' });
      };
      try {
        const audio = createAudio(); request.audio = audio;
        audio.preload = 'auto'; audio.playbackRate = rate;
        if ('preservesPitch' in audio) audio.preservesPitch = true;
        else if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = true;
        audio.onplaying = started;
        audio.onended = () => {
          if (obsolete(request) || request.fallbackStarted) return;
          release(request); current = null;
          emit('ended', { source: 'asset', label: entry.label });
          settle(request, { status: 'ended', source: 'asset' });
        };
        audio.onerror = () => { void useFallback(request, 'asset-error'); };
        audio.src = source;
        emit('loading', { source: 'asset', label: entry.label, rate });
        request.timer = setTimeout(() => { void useFallback(request, 'asset-timeout'); }, playTimeoutMs);
        Promise.resolve(audio.play()).then(() => {
          if (!isCurrent(request) || request.fallbackStarted) {
            // Some implementations settle play() after a previous pause/load.
            // Re-dispose this exact old element without touching a newer clip.
            disposeAudio(audio);
            if (!request.fallbackStarted) obsolete(request);
            return;
          }
          started();
        }, () => { void useFallback(request, 'asset-play-failed'); });
      } catch { void useFallback(request, 'asset-play-failed'); }
    });
  }

  function setRate(rate) {
    defaultRate = validRate(rate);
    if (current) {
      current.rate = rate;
      if (current.audio) current.audio.playbackRate = rate;
    }
    return rate;
  }

  return { play, stop, setRate };
}
