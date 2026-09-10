export const GRAVITY = 0.4;
export const RESTITUTION = 0.55;
export const FRICTION_GROUND = 0.78;
export const FRICTION_AIR = 0.995;
export const SLEEP_VEL = 0.4;
export const SLEEP_ROT = 0.08;
export const CTA_CLICK_MAX_PX = 18;

/** One simulation step, so the feel is the same on a 60Hz and a 120Hz display. */
export const STEP_MS = 1000 / 60;
export const MAX_STEPS_PER_FRAME = 3;
/**
 * Below this approach speed a contact just stops instead of bouncing. Without it
 * a single step of gravity is enough to make a resting block jitter forever.
 */
export const RESTITUTION_MIN_SPEED = 1.5;
/** Allowed penetration. Correcting all the way every step is what buzzes. */
export const PENETRATION_ALLOWANCE = 0.4;
export const POSITION_CORRECTION = 0.8;
/** Trailing window used to estimate throw speed on release. */
export const THROW_SAMPLE_MS = 90;
/** A pointer that has been still this long throws nothing, however fast it moved before. */
export const THROW_STALE_MS = 100;
export const THROW_GAIN = 1.4;

/** Drag: gravity torque about grab point (dangle; damped so it settles). */
export const DRAG_PENDULUM_GRAVITY = 0.055;
export const DRAG_PENDULUM_DAMP = 0.88;
export const DRAG_POINTER_SWING = 0.028;
/** Kept small: this opposes the gravity torque, so a large value pins the block level. */
export const DRAG_ROT_RESTORE = 0.015;
/** Small enough that a slow drag still swings instead of kicking past a threshold. */
export const DRAG_POINTER_DEAD = 0.15;
export const DRAG_ROT_MAX = 3.2;
/** On floor: extra spin decay + gentle straighten toward level (not instant snap). */
export const FLOOR_SPIN_DAMP = 0.68;
export const FLOOR_ROT_STRAIGHTEN = 0.91;

/** Solver passes per step: shelves first, then pairs, then shelves again. */
export const STATIC_ITERATIONS_PRE = 5;
export const PAIR_ITERATIONS = 3;
export const STATIC_ITERATIONS_POST = 3;
/** A held block is immovable, so it needs more passes to be pushed clear of a shelf. */
export const DRAG_CLAMP_ITERATIONS = 8;
/** Sideways drag lost by the pair standing on or under another block. */
export const STACK_FRICTION = 0.85;
/** Spin decay in flight, and the extra bite it takes on touching down. */
export const AIR_SPIN_DAMP = 0.88;
export const LAND_SPIN_DAMP = 0.35;
/** Steps a body must stay slow and supported before it is put to sleep. */
export const SLEEP_FRAMES = 30;
