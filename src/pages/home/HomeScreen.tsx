import { motion, type Variants } from 'motion/react';
import { ArrowRight, Download } from 'lucide-react';
import SiteFooter from '@/layout/SiteFooter';
import { LOCATION, NAME, RESUME_FILENAME, RESUME_URL, ROLE } from '@/content/site';
import { triggerDownload } from '@/lib/download';
import { EASE } from '@/lib/motion';
import './styles/home-screen.css';

type HomeScreenProps = {
  onViewProjects: () => void;
};

/** A piece that fades up into place, `delay` seconds after the screen mounts. */
const rise = (delay: number): Variants => ({
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, ease: EASE, delay } },
});

/** A word that climbs out of its own mask. */
const climb = (delay: number): Variants => ({
  hidden: { y: '112%' },
  shown: { y: 0, transition: { duration: 1.15, ease: EASE, delay } },
});

/**
 * The home: the name, one line and two actions, nothing more. Each piece
 * rises into place a beat after the last.
 */
export default function HomeScreen({ onViewProjects }: HomeScreenProps) {
  return (
    <div className="home-screen">
      <div className="grain" aria-hidden />

      <div className="home-hero">
        <motion.div className="home-block" initial="hidden" animate="shown">
          <h1 className="home-name">
            {NAME.split(' ').map((word, i) => (
              <span className="home-word" key={word}>
                <motion.span variants={climb(i * 0.1)}>{word}</motion.span>
              </span>
            ))}
          </h1>

          <motion.p className="home-where" variants={rise(0.3)}>
            {ROLE}
            <span className="home-where-dot" aria-hidden>
              ·
            </span>
            {LOCATION}
          </motion.p>

          <motion.div className="home-actions" variants={rise(0.44)}>
            <button type="button" className="home-action home-action-primary focus-ring" onClick={onViewProjects}>
              View projects
              <ArrowRight size={15} strokeWidth={2.4} aria-hidden />
            </button>
            <button
              type="button"
              className="home-action focus-ring"
              onClick={() => triggerDownload(RESUME_URL, RESUME_FILENAME)}
            >
              <Download size={15} strokeWidth={2.4} aria-hidden />
              Resume
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* The shared footer, pinned to the bottom instead of ending a scroll. */}
      <motion.div className="home-footer-slot" initial="hidden" animate="shown" variants={rise(0.65)}>
        <div className="mx-auto w-full max-w-6xl px-6">
          <SiteFooter className="pt-10 pb-8" />
        </div>
      </motion.div>
    </div>
  );
}
