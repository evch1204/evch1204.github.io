---
name: motion-reel
description: Make a clean, production-grade motion video of this site (or any page of it) rendered from code with scripts/reel. Use when the user asks for a reel, showreel, launch video, demo video, motion design video, or an MP4 of the site's animation, or wants the site's own motion made cleaner first. Nothing to install or pay for; Chrome, Node and ffmpeg already on the machine.
---

# Motion reel

A reel here is not a screen recording and not a re-creation: it is the **real site**, filmed one
frame at a time under a clock the renderer controls, so every frame is a pure function of time
and two renders are identical. The camera is a crop of the viewport rendered at full size (vector
UI stays sharp when zoomed), the pointer is scripted, the music is synthesized in code, and the
director looks at contact sheets before anyone else sees the film.

Everything lives in `scripts/reel/`:

| file | what it is |
| --- | --- |
| `clock.js` | injected into the page: replaces `performance.now`, `Date`, timers, `requestAnimationFrame`, turns Motion's Web Animations off; `window.__seek(ms)` advances it |
| `cdp.mjs` | dependency-free DevTools client over the installed Chrome |
| `film.mjs` | the engine: `Film` with camera (`cutTo`, `pushTo`, `follow`), pointer (`moveTo`, `press`, `release`, `click`), `scroll`, `cue`, `until`, `over`, `rect`, `measure` |
| `music.mjs` | the soundtrack: 120 BPM felt-piano arpeggio + pulse, and the effects by cue name (`scratch`, `whoosh`, `plip`, `pop`, `click`, `swish`); seeded noise only |
| `review.mjs` | contact sheet, phone sheet, strip, poster, loop check |
| `render.mjs` | the command: serves `dist/`, films a reel script, mixes to -14 LUFS, writes the sheets |
| `home.reel.mjs` | the home page's 30 s reel: the worked example to copy |

## Commands

```bash
npm run build                                                    # the reel films dist/
node scripts/reel/render.mjs scripts/reel/home.reel.mjs --draft  # 960x540, 30 fps, ~1 min: for looking
node scripts/reel/render.mjs scripts/reel/home.reel.mjs          # 1920x1080, 60 fps, 2 sub-frames of motion blur, ~8 min
node scripts/reel/render.mjs scripts/reel/home.reel.mjs --png    # lossless captures (4x slower; JPEG q95 is the default)
node scripts/reel/render.mjs <reel> --draft --to 12              # only the first 12 s
node scripts/reel/review.mjs out/home/final.mp4 --strip 4.4      # sheets again, a strip round one moment
```

Output: `out/<name>/final.mp4` (+ `silent.mp4`, `audio.wav`, `cues.json`, `contact.png`, `phone.png`,
`strip.png`, `poster.png`, `loop_check.mp4`). `out/` is git-ignored. Each render needs a free DevTools
port (default 9340) and preview port (4197); pass `--devtools` / `--port` to run two at once.
Kill leftovers by port (`netstat -ano | grep :9340`, `taskkill //PID n //F //T`), never node.exe wholesale.

## Pipeline (do not skip a gate)

1. **Look at the motion before filming it.** Film the raw page with the engine (a reel that only
   calls `film.until`) and read the contact sheet. If the site's own motion is not clean, fix the
   site first (see "Clean motion" below), then film. Never fake a better animation in the reel.
2. **Write the shot list on the beat grid.** 120 BPM: a beat is 0.5 s, a bar 2 s. Every cut on a
   beat, something new every 2 to 4 s, a hook in the first 2 s (the pen touching paper, close), a
   payoff every 3 to 5 s. Use `meta.lead` to slide the site's clock so its key moment lands on a beat.
   Write it as the comment at the top of the reel script and show it to the user before rendering.
3. **Direct it in a reel script** (copy `home.reel.mjs`): `export const meta = { name, duration, bpm,
   lead, ready, strip, poster }` and `export default async (film, { to }) => { ... }`. Measure
   elements with `film.rect(selector, i)`; never hard-code positions. Add a `cue` for every sound
   at the moment the thing happens on screen.
4. **Draft, then critique.** `--draft`, open `contact.png` and `phone.png`, and be a harsh motion
   director, not a proud author. Score 1-10: hook in first 2 s, readability at phone size, motion
   quality, variety, composition, brand accuracy, sound sync. List the three worst problems with
   timestamps; hunt for text cut at a frame edge, a crop with a sliver of another element, a dead
   beat, a cursor that teleports, anything sliding instead of easing, a stutter. Fix, re-draft.
   **Three rounds minimum, every score 8+.** Pull a `--strip` around any fast moment.
5. **Full render** only then. Check loudness (`ffmpeg -i final.mp4 -af ebur128 -f null -`: I near
   -14 LUFS) and the loop check if the film is meant to loop.
6. **Deliver**: the mp4 path, the poster, what you would improve next.

## Render contract (house rules)

- The page is filmed under `clock.js`: no real time leaks in. If something moves between two
  renders of the same script, find the `Math.random`, live `Date` or CSS animation that escaped the
  clock. CSS animations and transitions are paused and seeked over the Animation domain; do not
  use `--virtual-time-budget` or Chrome's virtual time (Motion's Web Animations ignore it).
- Camera: crops keep the output's proportions and stay inside the viewport (`film.fit`). Cut on
  beats; push slowly (`pushTo` over 1 to 2 s, `LINEAR` or `EASE`); follow a moving thing with
  `follow(async f => rect)` and settle the camera as the thing comes to rest.
- Pointer: the site's pencil is drawn into the frame. Move with `moveTo` over 0.3 to 0.6 s, never
  teleport while visible. Hide it (`cursor(-100, -100, false)`) for shots with nothing to point at.
- Sound: every visible event has a cue; music from code unless a track is supplied, then measure
  its beat grid (no Python on this machine: ask the user for the BPM or count it from a waveform).
  Mix to -14 LUFS, true peak -1.5 dB (render.mjs does this).
- Encode H.264 yuv420p, CRF 16, 60 fps, 2 sub-frames blended for motion blur. Frames are captured as
  JPEG q95 (PNG is 4x slower at full size and invisible after H.264); pass `--png` if a frame is to be kept as a still.
- A full render takes minutes: start it detached (PowerShell `Start-Process node ... -RedirectStandardOutput`)
  and poll its log, so no tool timeout kills it. One render at a time: stale renders leave Chrome and ffmpeg
  processes that starve the next one.

## Banned looks

Centered title on a gradient; everything fading in; corner labels and frame borders; glow on UI;
generic particle bursts; a redrawn or invented UI (film the real page); a crop that shows a sliver
of a neighbouring element; dead time; a cursor that appears from nowhere.

## Clean motion (what "production grade" means on this site)

The hello is the reference: one heavy monoline, one pace, written in real time, nothing else moving.
Everything that follows should keep that discipline:

- **One causal chain, one thing at a time.** Ink drains into the drop; the drop flies alone on a
  clean sheet; it lands as the pin; the map spreads from the pin; the flight heads west; the name is
  written as the plane arrives. Never two unrelated things at once.
- **Written, not faded.** Text comes in with the clip-path `write` variant, drawings with `Pen`.
  `opacity` alone is for the header and for reduced motion.
- **Weight.** Things that land use the `POP` spring in `src/lib/motion.ts` (a hair of overshoot);
  a thrown thing accelerates and lands at speed, and the ring takes the impact; nothing slows to a
  halt in mid-air. Easing for pens is `PEN_EASE`, for entrances `EASE`; no third curve.
- **Shared clocks.** The hello and the drop read `src/pages/home/intro.ts`; the left column reads
  `T` in `HomeScreen.tsx`; the scene reads `T` in `SketchScene.tsx`. Change a time in one place.
- Verify with the engine, not by eye in a browser: film the page, tile the frames, look.

## Known gotchas

- Vite's preview listens on `localhost` (IPv6); `127.0.0.1` does not answer.
- Chrome needs an absolute `--user-data-dir`; `Film` resolves `out` for you.
- `Page.captureScreenshot` with a `clip` and `scale` re-rasterizes the crop: zoomed text stays sharp,
  so a close-up costs nothing in quality.
- Hover effects need the pointer to be *over* the element's hit area: measure `.home-thing` /
  `.home-hit`, not the drawing's bounding box.
- A scroll set with `film.scroll` reaches Motion's `useScroll` one frame later; that is fine.
- Chrome's clipped screenshots come back a pixel short now and then (1920x1079). ffmpeg rebuilds its
  filter graph on a size change and drops frames (a 30 s film came out 5 s long). `film.mjs` therefore
  runs ffmpeg with `-reinit_filter 0` and `scale=W:H` as the first filter; keep both if you touch the chain,
  and check `ffprobe -count_frames` on `silent.mp4` after any change to it.
