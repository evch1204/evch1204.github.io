import { useEffect, useRef, useState } from 'react';
import { Github, Hand, Linkedin, Mail } from 'lucide-react';
import './home-screen.css';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

type PhysBody = {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  rotV: number;
  sleeping: boolean;
  sleepTimer: number;
  cta?: 'projects' | 'resume' | 'github' | 'linkedin' | 'mail';
  sourceSpan: HTMLSpanElement;
  homing?: boolean;
};

/** Axis-aligned obstacles (typed copy like “Hello ” / “My specialties are ”) in physics-container space. */
type StaticRect = { x: number; y: number; w: number; h: number };

const GRAVITY = 0.4;
const RESTITUTION = 0.55;
const FRICTION_GROUND = 0.78;
const FRICTION_AIR = 0.995;
const SLEEP_VEL = 0.4;
const SLEEP_ROT = 0.08;
const SLOP = 0.5;
const CTA_CLICK_MAX_PX = 18;

export type HomeScreenProps = {
  onViewProjects?: () => void;
  resumeUrl?: string;
  /** When true (user navigated away), physics rAF pauses but block positions stay in memory. */
  isPaused?: boolean;
};

export default function HomeScreen({ onViewProjects, resumeUrl, isPaused = false }: HomeScreenProps) {
  const [resetBusy, setResetBusy] = useState(false);
  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;
  const physicsControlsRef = useRef<{ pause: () => void; resume: () => void } | null>(null);
  const physContainerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const homeRootRef = useRef<HTMLDivElement>(null);

  const text1Ref = useRef<HTMLSpanElement>(null);
  const text2Ref = useRef<HTMLSpanElement>(null);
  const c1Ref = useRef<HTMLSpanElement>(null);
  const c2Ref = useRef<HTMLSpanElement>(null);
  const blockNameRef = useRef<HTMLSpanElement>(null);
  const blockDataRef = useRef<HTMLSpanElement>(null);
  const blockSoftwareRef = useRef<HTMLSpanElement>(null);
  const blockMlRef = useRef<HTMLSpanElement>(null);
  const blockProjectsRef = useRef<HTMLSpanElement>(null);
  const blockResumeRef = useRef<HTMLSpanElement>(null);
  const handRef = useRef<HTMLSpanElement>(null);
  const socialGithubRef = useRef<HTMLSpanElement>(null);
  const socialLinkedinRef = useRef<HTMLSpanElement>(null);
  const socialMailRef = useRef<HTMLSpanElement>(null);

  const onViewProjectsRef = useRef(onViewProjects);
  const resumeUrlRef = useRef(resumeUrl);
  onViewProjectsRef.current = onViewProjects;
  resumeUrlRef.current = resumeUrl;

  const resetHomingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    let cancelled = false;
    const blockCleanups: (() => void)[] = [];

    async function typeText(el: HTMLElement, text: string, speed = 55) {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        el.textContent = text.slice(0, i);
        await sleep(speed + Math.random() * 30);
      }
    }

    async function typeIntoBlock(blockEl: HTMLSpanElement, label: string, speed = 55) {
      blockEl.style.opacity = '1';
      blockEl.textContent = '';
      const fullW =
        blockEl.dataset.fullW ||
        (() => {
          blockEl.textContent = label;
          const w = blockEl.offsetWidth;
          blockEl.style.width = `${w}px`;
          blockEl.style.minWidth = `${w}px`;
          blockEl.textContent = '';
          blockEl.dataset.fullW = String(w);
          return String(w);
        })();
      blockEl.dataset.fullW = fullW;
      for (let i = 0; i <= label.length; i++) {
        if (cancelled) return;
        blockEl.textContent = label.slice(0, i);
        await sleep(speed + Math.random() * 28);
      }
    }

    async function revealHandBlock(el: HTMLSpanElement) {
      el.style.opacity = '1';
      const w = el.offsetWidth;
      el.style.width = `${w}px`;
      el.style.minWidth = `${w}px`;
      el.dataset.fullW = String(w);
      await sleep(340);
    }

    const physContainer = physContainerRef.current;
    const hint = hintRef.current;
    const introEl = introRef.current;
    if (!physContainer || !hint) return;

    physContainer.replaceChildren();
    introEl?.classList.remove('intro-launchable');

    const textBlocksToReset = [
      blockNameRef.current,
      blockDataRef.current,
      blockSoftwareRef.current,
      blockMlRef.current,
      blockProjectsRef.current,
      blockResumeRef.current,
    ].filter(Boolean) as HTMLSpanElement[];

    for (const b of textBlocksToReset) {
      b.removeAttribute('data-phys-launched');
      delete b.dataset.fullW;
      b.style.width = '';
      b.style.minWidth = '';
      b.style.opacity = '0';
      b.textContent = '';
    }

    const iconBlocksToReset = [
      handRef.current,
      socialGithubRef.current,
      socialLinkedinRef.current,
      socialMailRef.current,
    ].filter(Boolean) as HTMLSpanElement[];

    for (const b of iconBlocksToReset) {
      b.removeAttribute('data-phys-launched');
      delete b.dataset.fullW;
      b.style.width = '';
      b.style.minWidth = '';
      b.style.opacity = '0';
    }
    if (text1Ref.current) text1Ref.current.textContent = '';
    if (text2Ref.current) text2Ref.current.textContent = '';
    if (c1Ref.current) c1Ref.current.style.display = 'none';
    if (c2Ref.current) c2Ref.current.style.display = 'none';
    hint.style.opacity = '0';

    const bodies: PhysBody[] = [];

    function containerOffset(clientX: number, clientY: number) {
      const cr = physContainer.getBoundingClientRect();
      return { x: clientX - cr.left, y: clientY - cr.top };
    }

    let dragging: PhysBody | null = null;
    let dragOffX = 0;
    let dragOffY = 0;
    let lastMX = 0;
    let lastMY = 0;
    let velDragX = 0;
    let velDragY = 0;
    let dragPointerStartX = 0;
    let dragPointerStartY = 0;
    let physicsStarted = false;
    let rafId = 0;

    function triggerResumeDownload() {
      const href = resumeUrlRef.current;
      if (!href) return;
      const a = document.createElement('a');
      a.href = href;
      a.download = '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }

    function createPhysBlock(
      label: string,
      cls: string,
      x: number,
      y: number,
      vx: number,
      vy: number,
      sourceSpan: HTMLSpanElement,
      fixedW?: number,
      fixedH?: number,
      cta?: PhysBody['cta'],
      physInnerHtml?: string,
    ) {
      const el = document.createElement('div');
      el.className = `phys-block ${cls}`;
      if (physInnerHtml) {
        el.innerHTML = physInnerHtml;
        el.classList.add('phys-block--rich');
      } else {
        el.textContent = label;
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      if (fixedW) {
        el.style.width = `${fixedW}px`;
        el.style.minWidth = `${fixedW}px`;
      }
      physContainer.appendChild(el);

      const w = fixedW || el.offsetWidth || 100;
      const h = fixedH || el.offsetHeight || 38;

      const body: PhysBody = {
        el,
        x,
        y,
        vx,
        vy,
        w,
        h,
        rot: 0,
        rotV: 0,
        sleeping: false,
        sleepTimer: 0,
        cta,
        sourceSpan,
      };
      bodies.push(body);

      function startDrag(clientX: number, clientY: number) {
        if (body.sleeping) {
          body.sleeping = false;
          body.sleepTimer = 0;
        }
        dragging = body;
        const rect = body.el.getBoundingClientRect();
        dragOffX = clientX - rect.left;
        dragOffY = clientY - rect.top;
        lastMX = clientX;
        lastMY = clientY;
        dragPointerStartX = clientX;
        dragPointerStartY = clientY;
        velDragX = 0;
        velDragY = 0;
        body.rotV = 0;
      }

      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      });
      el.addEventListener(
        'touchstart',
        (e) => {
          e.preventDefault();
          const t = e.touches[0];
          startDrag(t.clientX, t.clientY);
        },
        { passive: false },
      );

      return body;
    }

    function resolveCollision(a: PhysBody, b: PhysBody) {
      if (a.homing || b.homing) return;
      if (a.sleeping && b.sleeping) return;

      const cx1 = a.x + a.w / 2;
      const cy1 = a.y + a.h / 2;
      const cx2 = b.x + b.w / 2;
      const cy2 = b.y + b.h / 2;

      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const overlapX = (a.w + b.w) / 2 - Math.abs(dx);
      const overlapY = (a.h + b.h) / 2 - Math.abs(dy);

      if (overlapX <= 0 || overlapY <= 0) return;

      const aFixed = a === dragging;
      const bFixed = b === dragging;

      if (overlapX < overlapY) {
        const nx = Math.sign(dx);
        const sep = overlapX + SLOP;
        if (!aFixed && !bFixed) {
          a.x -= nx * sep * 0.5;
          b.x += nx * sep * 0.5;
        } else if (aFixed) {
          b.x += nx * sep;
        } else {
          a.x -= nx * sep;
        }

        const relVx = b.vx - a.vx;
        const j = (-(1 + RESTITUTION) * relVx * nx) / 2;
        const imp = j * nx;
        if (!aFixed) a.vx -= imp;
        if (!bFixed) b.vx += imp;
      } else {
        const ny = Math.sign(dy);
        const sep = overlapY + SLOP;
        if (!aFixed && !bFixed) {
          a.y -= ny * sep * 0.5;
          b.y += ny * sep * 0.5;
        } else if (aFixed) {
          b.y += ny * sep;
        } else {
          a.y -= ny * sep;
        }

        const relVy = b.vy - a.vy;
        const j = (-(1 + RESTITUTION) * relVy * ny) / 2;
        const imp = j * ny;
        if (!aFixed) a.vy -= imp;
        if (!bFixed) b.vy += imp;

        const frictionScale = 0.85;
        if (!aFixed) a.vx *= frictionScale;
        if (!bFixed) b.vx *= frictionScale;
      }

      if (!aFixed) {
        a.sleeping = false;
        a.sleepTimer = 0;
      }
      if (!bFixed) {
        b.sleeping = false;
        b.sleepTimer = 0;
      }
    }

    const staticRectsBuf: StaticRect[] = [];

    function collectStaticTextRects() {
      staticRectsBuf.length = 0;
      const cr = physContainer.getBoundingClientRect();
      const push = (el: HTMLElement | null) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        staticRectsBuf.push({
          x: r.left - cr.left,
          y: r.top - cr.top,
          w: r.width,
          h: r.height,
        });
      };
      push(text1Ref.current);
      push(text2Ref.current);
    }

    /** Immovable typed-text regions: blocks bounce or slide off like platforms/walls. */
    function resolveStatic(b: PhysBody, s: StaticRect) {
      if (b.homing) return;

      const cx1 = b.x + b.w / 2;
      const cy1 = b.y + b.h / 2;
      const cx2 = s.x + s.w / 2;
      const cy2 = s.y + s.h / 2;
      const dx = cx2 - cx1;
      const dy = cy2 - cy1;
      const overlapX = (b.w + s.w) / 2 - Math.abs(dx);
      const overlapY = (b.h + s.h) / 2 - Math.abs(dy);

      if (overlapX <= 0 || overlapY <= 0) return;

      const isDrag = b === dragging;

      if (overlapX < overlapY) {
        const nx = Math.sign(dx);
        const sep = overlapX + SLOP;
        b.x -= nx * sep;
        if (!isDrag) {
          b.vx -= (1 + RESTITUTION) * (b.vx * nx) * nx;
          b.sleeping = false;
          b.sleepTimer = 0;
        }
      } else {
        const ny = Math.sign(dy);
        const sep = overlapY + SLOP;
        b.y -= ny * sep;
        if (!isDrag) {
          b.vy -= (1 + RESTITUTION) * (b.vy * ny) * ny;
          if (ny > 0) {
            b.vx *= FRICTION_GROUND;
            b.rotV *= 0.4;
          }
          b.sleeping = false;
          b.sleepTimer = 0;
        }
      }
    }

    function resolveAllStatics(iterations: number) {
      collectStaticTextRects();
      if (staticRectsBuf.length === 0) return;
      for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < bodies.length; i++) {
          const b = bodies[i];
          if (b.homing) continue;
          if (b.sleeping) continue;
          for (let k = 0; k < staticRectsBuf.length; k++) {
            resolveStatic(b, staticRectsBuf[k]);
          }
        }
      }
    }

    function syncBodyDom(b: PhysBody) {
      b.el.style.left = `${b.x}px`;
      b.el.style.top = `${b.y}px`;
      b.el.style.transform = `rotate(${b.rot}deg)`;
    }

    function tick() {
      if (cancelled) return;
      if (pausedRef.current) {
        rafId = 0;
        return;
      }
      const W = physContainer.clientWidth;
      const H = physContainer.clientHeight;

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];

        if (b.homing) {
          syncBodyDom(b);
          continue;
        }

        if (b === dragging) {
          b.vx = 0;
          b.vy = 0;
          continue;
        }

        if (b.sleeping) continue;

        b.vy += GRAVITY;
        b.vx *= FRICTION_AIR;
        b.vy *= FRICTION_AIR;
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.rotV;
        b.rotV *= 0.88;
        if (Math.abs(b.rotV) < 0.05) b.rotV = 0;

        if (b.x < 0) {
          b.x = 0;
          b.vx = Math.abs(b.vx) * RESTITUTION;
        }
        if (b.x + b.w > W) {
          b.x = W - b.w;
          b.vx = -Math.abs(b.vx) * RESTITUTION;
        }
        if (b.y < 0) {
          b.y = 0;
          b.vy = Math.abs(b.vy) * RESTITUTION;
        }
        if (b.y + b.h > H) {
          b.y = H - b.h;
          b.vy = -Math.abs(b.vy) * RESTITUTION;
          b.vx *= FRICTION_GROUND;
          b.rotV *= 0.4;
        }

        const speed = Math.abs(b.vx) + Math.abs(b.vy);
        const onFloor = b.y + b.h >= H - 1;
        if (speed < SLEEP_VEL && Math.abs(b.rotV) < SLEEP_ROT && onFloor) {
          b.sleepTimer = (b.sleepTimer || 0) + 1;
          if (b.sleepTimer > 30) {
            b.vx = 0;
            b.vy = 0;
            b.rotV = 0;
            b.sleeping = true;
          }
        } else {
          b.sleepTimer = 0;
        }
      }

      resolveAllStatics(5);

      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < bodies.length; i++) {
          for (let j = i + 1; j < bodies.length; j++) {
            resolveCollision(bodies[i], bodies[j]);
          }
        }
      }

      resolveAllStatics(3);

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (!b.homing) syncBodyDom(b);
      }

      if (bodies.length > 0 || dragging != null) {
        rafId = requestAnimationFrame(tick);
      } else {
        physicsStarted = false;
      }
    }

    function clampDragAgainstStatics() {
      if (!dragging) return;
      collectStaticTextRects();
      for (let iter = 0; iter < 8; iter++) {
        for (let k = 0; k < staticRectsBuf.length; k++) {
          resolveStatic(dragging, staticRectsBuf[k]);
        }
      }
      syncBodyDom(dragging);
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      velDragX = velDragX * 0.6 + (e.clientX - lastMX) * 0.4;
      velDragY = velDragY * 0.6 + (e.clientY - lastMY) * 0.4;
      const p = containerOffset(e.clientX - dragOffX, e.clientY - dragOffY);
      dragging.x = p.x;
      dragging.y = p.y;
      lastMX = e.clientX;
      lastMY = e.clientY;
      clampDragAgainstStatics();
    }

    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      const t = e.touches[0];
      velDragX = velDragX * 0.6 + (t.clientX - lastMX) * 0.4;
      velDragY = velDragY * 0.6 + (t.clientY - lastMY) * 0.4;
      const p = containerOffset(t.clientX - dragOffX, t.clientY - dragOffY);
      dragging.x = p.x;
      dragging.y = p.y;
      lastMX = t.clientX;
      lastMY = t.clientY;
      clampDragAgainstStatics();
    }

    function endDrag() {
      if (dragging) {
        const b = dragging;
        const dist = Math.hypot(lastMX - dragPointerStartX, lastMY - dragPointerStartY);
        if (b.cta && dist < CTA_CLICK_MAX_PX) {
          if (b.cta === 'projects') {
            onViewProjectsRef.current?.();
          } else if (b.cta === 'resume') {
            triggerResumeDownload();
          } else if (b.cta === 'github') {
            window.open('https://github.com/evch1204', '_blank', 'noopener,noreferrer');
          } else if (b.cta === 'linkedin') {
            window.open('https://www.linkedin.com/in/evan-chang1/', '_blank', 'noopener,noreferrer');
          } else if (b.cta === 'mail') {
            window.location.href = 'mailto:changtei1204@gmail.com';
          }
        }

        b.vx = velDragX * 1.8;
        b.vy = velDragY * 1.8;
        b.rotV = velDragX * 0.2;
        b.sleeping = false;
        dragging = null;
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    async function launchBlock(
      blockEl: HTMLSpanElement,
      cls: string,
      label: string,
      cta?: PhysBody['cta'],
    ) {
      const rect = blockEl.getBoundingClientRect();
      const cr = physContainer.getBoundingClientRect();
      const x = rect.left - cr.left;
      const y = rect.top - cr.top;
      const vx = (Math.random() - 0.5) * 3;
      const vy = -1.5 + Math.random() * -2;
      const physInnerHtml = blockEl.dataset.physHtml === '1' ? blockEl.innerHTML : undefined;
      blockEl.style.opacity = '0';
      createPhysBlock(label, cls, x, y, vx, vy, blockEl, rect.width, rect.height, cta, physInnerHtml);
      if (!physicsStarted) {
        physicsStarted = true;
        rafId = requestAnimationFrame(tick);
        hint.textContent = 'Drag blocks — tap buttons when still to open';
        hint.style.opacity = '1';
      }
    }

    function getBlockLaunchConfigs(): {
      el: HTMLSpanElement;
      cls: string;
      label: string;
      cta?: PhysBody['cta'];
    }[] {
      return [
        { el: blockNameRef.current!, cls: 'name', label: "I'm Tei Chang" },
        { el: handRef.current!, cls: 'hand-wave', label: '👋' },
        { el: blockDataRef.current!, cls: 'data specialty', label: 'data science' },
        { el: blockSoftwareRef.current!, cls: 'software specialty', label: 'software engineering' },
        { el: blockMlRef.current!, cls: 'ml specialty', label: 'machine learning' },
        { el: blockProjectsRef.current!, cls: 'cta', label: 'View projects', cta: 'projects' },
        { el: blockResumeRef.current!, cls: 'cta', label: 'Download resume', cta: 'resume' },
        { el: socialGithubRef.current!, cls: 'social-github', label: 'GH', cta: 'github' },
        { el: socialLinkedinRef.current!, cls: 'social-linkedin', label: 'in', cta: 'linkedin' },
        { el: socialMailRef.current!, cls: 'social-mail', label: '@', cta: 'mail' },
      ];
    }

    async function runAutoFallSequence() {
      const configs = getBlockLaunchConfigs();
      hint.style.opacity = '1';
      for (let i = 0; i < configs.length; i++) {
        if (cancelled) return;
        const { el, cls, label, cta } = configs[i];
        el.setAttribute('data-phys-launched', '1');
        void launchBlock(el, cls, label, cta);
        if (i < configs.length - 1) await sleep(150);
      }
    }

    function detachBlockLaunchers() {
      blockCleanups.forEach((fn) => fn());
      blockCleanups.length = 0;
      introEl?.classList.remove('intro-launchable');
      homeRootRef.current?.classList.remove('home-fall-ready');
    }

    function attachBlockLaunchers() {
      detachBlockLaunchers();
      const configs = getBlockLaunchConfigs();

      for (const { el, cls, label, cta } of configs) {
        const onActivate = () => {
          if (cancelled || el.getAttribute('data-phys-launched') === '1') return;
          el.setAttribute('data-phys-launched', '1');
          void launchBlock(el, cls, label, cta);
        };
        el.addEventListener('click', onActivate);
        blockCleanups.push(() => el.removeEventListener('click', onActivate));
      }

      introEl?.classList.add('intro-launchable');
      homeRootRef.current?.classList.add('home-fall-ready');
    }

    async function animateBodyHome(body: PhysBody): Promise<void> {
      const span = body.sourceSpan;
      body.homing = true;
      body.vx = 0;
      body.vy = 0;
      body.rotV = 0;
      body.sleeping = false;
      if (dragging === body) dragging = null;

      const sx = body.x;
      const sy = body.y;
      const sRot = body.rot;
      const duration = 440;

      await new Promise<void>((resolve) => {
        const start = performance.now();
        function frame(now: number) {
          if (cancelled) {
            body.homing = false;
            resolve();
            return;
          }
          const u = Math.min(1, (now - start) / duration);
          const e = easeOutCubic(u);
          const cr = physContainer.getBoundingClientRect();
          const sr = span.getBoundingClientRect();
          const tx = sr.left - cr.left;
          const ty = sr.top - cr.top;

          body.x = sx + (tx - sx) * e;
          body.y = sy + (ty - sy) * e;
          body.rot = sRot * (1 - e);
          body.el.style.left = `${body.x}px`;
          body.el.style.top = `${body.y}px`;
          body.el.style.transform = `rotate(${body.rot}deg)`;

          if (u < 1) {
            requestAnimationFrame(frame);
          } else {
            span.style.opacity = '1';
            span.removeAttribute('data-phys-launched');
            body.el.remove();
            const idx = bodies.indexOf(body);
            if (idx >= 0) bodies.splice(idx, 1);
            body.homing = false;
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    async function runResetHoming() {
      if (bodies.length === 0) return;

      if (dragging) {
        dragging.vx = 0;
        dragging.vy = 0;
        dragging.rotV = 0;
        dragging = null;
      }

      hint.style.opacity = '0';
      detachBlockLaunchers();

      const configs = getBlockLaunchConfigs();
      for (const cfg of configs) {
        if (cancelled) return;
        const body = bodies.find((b) => b.sourceSpan === cfg.el);
        if (!body) continue;
        await animateBodyHome(body);
        if (cancelled) return;
        await sleep(48);
      }

      hint.textContent = 'Tap a block to drop it — physics starts when you do';
      hint.style.opacity = '1';
      attachBlockLaunchers();
    }

    resetHomingRef.current = async () => {
      if (cancelled) return;
      setResetBusy(true);
      try {
        await runResetHoming();
      } finally {
        setResetBusy(false);
      }
    };

    function revealSocialChips(nodes: HTMLSpanElement[]) {
      for (const el of nodes) {
        el.style.opacity = '1';
        const w = el.offsetWidth;
        el.style.width = `${w}px`;
        el.style.minWidth = `${w}px`;
        el.dataset.fullW = String(w);
      }
    }

    async function runIntro() {
      await sleep(400);
      if (cancelled) return;

      const t1 = text1Ref.current;
      const t2 = text2Ref.current;
      const c1 = c1Ref.current;
      const c2 = c2Ref.current;
      const bName = blockNameRef.current;
      const bData = blockDataRef.current;
      const bSoft = blockSoftwareRef.current;
      const bMl = blockMlRef.current;
      const bProjects = blockProjectsRef.current;
      const bResume = blockResumeRef.current;
      const bHand = handRef.current;
      const sg = socialGithubRef.current;
      const sli = socialLinkedinRef.current;
      const sm = socialMailRef.current;
      if (!t1 || !t2 || !c1 || !c2 || !bName || !bData || !bSoft || !bMl || !bProjects || !bResume || !bHand || !sg || !sli || !sm) return;

      revealSocialChips([sg, sli, sm]);

      c1.style.display = 'inline-block';
      await typeText(t1, 'Hello ', 58);
      if (cancelled) return;
      c1.style.display = 'none';
      await typeIntoBlock(bName, "I'm Tei Chang", 52);
      if (cancelled) return;
      await revealHandBlock(bHand);
      if (cancelled) return;
      await sleep(350);

      c2.style.display = 'inline-block';
      await typeText(t2, 'My specialties are ', 52);
      if (cancelled) return;
      c2.style.display = 'none';
      await sleep(120);
      await typeIntoBlock(bData, 'data science', 50);
      if (cancelled) return;
      await sleep(70);
      await typeIntoBlock(bSoft, 'software engineering', 50);
      if (cancelled) return;
      await sleep(70);
      await typeIntoBlock(bMl, 'machine learning', 50);
      if (cancelled) return;
      await sleep(400);

      await typeIntoBlock(bProjects, 'View projects', 45);
      if (cancelled) return;
      await sleep(70);
      await typeIntoBlock(bResume, 'Download resume', 45);
      if (cancelled) return;
      await sleep(400);

      if (cancelled) return;
      await runAutoFallSequence();
    }

    physicsControlsRef.current = {
      pause: () => {
        cancelAnimationFrame(rafId);
        rafId = 0;
      },
      resume: () => {
        if (pausedRef.current) return;
        if (!physicsStarted) return;
        if (bodies.length === 0 && dragging === null) return;
        if (rafId) return;
        rafId = requestAnimationFrame(tick);
      },
    };

    runIntro();

    return () => {
      cancelled = true;
      resetHomingRef.current = null;
      cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchend', endDrag);
      blockCleanups.forEach((fn) => fn());
      physContainer.replaceChildren();
      introEl?.classList.remove('intro-launchable');
      homeRootRef.current?.classList.remove('home-fall-ready');
      physicsControlsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ctl = physicsControlsRef.current;
    if (!ctl) return;
    if (isPaused) ctl.pause();
    else ctl.resume();
  }, [isPaused]);

  return (
    <div className="home-screen" ref={homeRootRef}>
      <div className="grain" aria-hidden />
      <div id="intro" ref={introRef}>
        <div className="line" id="line1">
          <span className="typed-text" ref={text1Ref} />
          <span className="word-block name" ref={blockNameRef} id="block-name">
            I'm Tei Chang
          </span>
          <span
            ref={handRef}
            id="block-hand"
            className="word-block hand-wave-block"
            data-phys-html="1"
            aria-hidden
          >
            <Hand className="home-hand-svg" strokeWidth={2} aria-hidden />
          </span>
          <span ref={c1Ref} className="cursor" style={{ display: 'none' }} />
        </div>
        <div className="line" id="line2" style={{ marginTop: 'clamp(12px, 2.5vw, 24px)' }}>
          <span className="typed-text small" ref={text2Ref} />
          <span ref={c2Ref} className="cursor" style={{ display: 'none' }} />
        </div>
        <div className="line" id="line3">
          <span className="word-block data specialty" ref={blockDataRef} id="block-data">
            data science
          </span>
          <span className="word-block software specialty" ref={blockSoftwareRef} id="block-software">
            software engineering
          </span>
          <span className="word-block ml specialty" ref={blockMlRef} id="block-ml">
            machine learning
          </span>
        </div>
        <div className="line line-actions" id="line4">
          <span className="word-block cta" ref={blockProjectsRef} id="block-projects">
            View projects
          </span>
          <span className="word-block cta" ref={blockResumeRef} id="block-resume">
            Download resume
          </span>
        </div>
      </div>

      <div id="physics-container" ref={physContainerRef} />

      {/* Same row layout as App header: left | nav (invisible width) | socials */}
      <div
        className="home-floating-socials fixed top-8 left-0 right-0 z-[45] px-6 flex items-center gap-4 pointer-events-none"
        aria-label="Social links"
      >
        <div className="flex-1 min-w-0" aria-hidden />
        <nav
          className="home-floating-nav-spacer shrink-0 p-1.5 flex items-center gap-1 rounded-full border border-transparent opacity-0 pointer-events-none select-none"
          aria-hidden
        >
          {(['Home', 'About', 'Experience', 'Projects', 'Contact'] as const).map((label) => (
            <span
              key={label}
              className="relative px-6 py-2 text-sm font-semibold rounded-full whitespace-nowrap text-transparent"
            >
              {label}
            </span>
          ))}
        </nav>
        <div className="flex-1 min-w-0 flex justify-end items-center gap-5">
          <span
            ref={socialGithubRef}
            className="word-block home-social-fall"
            data-phys-html="1"
            title="GitHub"
          >
            <Github size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            ref={socialLinkedinRef}
            className="word-block home-social-fall"
            data-phys-html="1"
            title="LinkedIn"
          >
            <Linkedin size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
          <span
            ref={socialMailRef}
            className="word-block home-social-fall"
            data-phys-html="1"
            title="Email"
          >
            <Mail size={22} strokeWidth={2} className="home-social-icon" aria-hidden />
          </span>
        </div>
      </div>

      <button
        type="button"
        className="home-reset-btn"
        disabled={resetBusy}
        onClick={() => void resetHomingRef.current?.()}
      >
        {resetBusy ? 'Resetting…' : 'Reset'}
      </button>

      <div id="hint" ref={hintRef}>
        Tap a block to drop it — physics starts when you do
      </div>
    </div>
  );
}
