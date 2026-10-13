/*
 * The film's clock, put into the page before any of its own scripts run.
 *
 * Every source of time the site animates from is replaced by one virtual
 * clock that only moves when the renderer says so: performance.now, Date,
 * timers and requestAnimationFrame. Motion's Web Animations path is turned
 * off so its animations run on that same clock. CSS animations and
 * transitions are paused and seeked by the renderer over the DevTools
 * protocol. The result is a page that is a pure function of time: frame t
 * looks the same however long the screenshot before it took.
 *
 * window.__seek(ms): advances the clock to `ms`, one frame at a time, running
 * every timer and animation frame that falls due, and letting the page's own
 * task queue (React's scheduler, scroll events) catch up between frames.
 */
(() => {
  const realSetTimeout = window.setTimeout.bind(window);
  const realRAF = window.requestAnimationFrame.bind(window);
  const RealDate = Date;
  const epoch = RealDate.now();

  let T = 0;
  let nextId = 1;
  const timers = new Map();
  let rafs = new Map();

  performance.now = () => T;
  window.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(epoch + T);
      else super(...args);
    }
    static now() {
      return epoch + T;
    }
  };
  window.setTimeout = (fn, ms = 0, ...args) => {
    const id = nextId++;
    timers.set(id, { at: T + Math.max(0, Number(ms) || 0), fn, args });
    return id;
  };
  window.setInterval = (fn, ms = 0, ...args) => {
    const id = nextId++;
    const every = Math.max(1, Number(ms) || 0);
    timers.set(id, { at: T + every, fn, args, every });
    return id;
  };
  window.clearTimeout = window.clearInterval = (id) => {
    timers.delete(id);
  };
  window.requestAnimationFrame = (fn) => {
    const id = nextId++;
    rafs.set(id, fn);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    rafs.delete(id);
  };
  // Without this, Motion hands opacity, transform and clip-path to the browser's own clock.
  delete Element.prototype.animate;

  const run = (fn, args) => {
    try {
      typeof fn === 'function' ? fn(...args) : new Function(fn)();
    } catch (e) {
      console.error(e);
    }
  };
  /** One real rendering step and one real task: the page's own queue (React, scroll events) runs. */
  const settle = () => new Promise((r) => realRAF(() => realSetTimeout(r, 0)));

  window.__seek = async (to, frame = 1000 / 60) => {
    while (T < to - 1e-6) {
      const next = Math.min(to, T + frame);
      for (;;) {
        let due = null;
        for (const [id, t] of timers) if (t.at <= next && (!due || t.at < due[1].at)) due = [id, t];
        if (!due) break;
        const [id, t] = due;
        T = Math.max(T, t.at);
        if (t.every) t.at += t.every;
        else timers.delete(id);
        run(t.fn, t.args);
      }
      T = next;
      const batch = rafs;
      rafs = new Map();
      for (const fn of batch.values()) run(fn, [T]);
      await settle();
    }
    return T;
  };
  window.__now = () => T;
  window.__settle = settle;
})();
