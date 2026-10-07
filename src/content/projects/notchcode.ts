import diffRequest from '@/assets/images/projects/notchcode/diff-request.svg';
import hero from '@/assets/images/projects/notchcode/hero.svg';
import states from '@/assets/images/projects/notchcode/states.svg';
import cardSessions from '@/assets/images/projects/notchcode/card-sessions.svg';
import cardGit from '@/assets/images/projects/notchcode/card-git.svg';
import cardGitClean from '@/assets/images/projects/notchcode/card-git-clean.svg';
import type { Project } from './types';
import { GITHUB_URL } from '@/content/site';

export const NOTCHCODE: Project = {
  id: 'notchcode',
  cardTitle: 'notchcode',
  kind: 'macOS app',
  group: 'apps',
  githubUrl: `${GITHUB_URL}/notchcode`,
  // The drawing is wide and dark, so the card's window shows it whole rather than filling from the top.
  panel: {
    kind: 'figure',
    figure: { src: diffRequest, alt: 'The notch grown into a card with a request to edit Cart.tsx and its diff', caption: 'A request, with its diff' },
  },
  cardDescription:
    'The MacBook notch as a companion for Claude Code: see what every session is doing from any app, and allow or deny a permission request with one key, with the real diff open under the notch, without leaving your work.',
  cardTags: ['Swift', 'SwiftUI', 'macOS', 'Claude Code'],
  keyFeatures: [
    'A doorbell: when Claude asks to run a command, edit a file or commit, the notch grows, names the request and waits; ⏎ allows, ⌫ denies, A allows always',
    'D opens the exact diff Claude wants to write inside the card, so you approve what you have read, not a pair of counts',
    'A traffic light from any app or space: working, blocked on you, or done, across every session on the machine',
    'Five tools in one card: Sessions by repository and worktree, Changes as a timeline, Files with changed lines tinted, Git with commit, push, pull and undo, and Usage with the 5-hour and weekly limits',
    'Teleport: every session knows which terminal started it, and one key lands you in that window',
  ],
  technologies: ['Swift', 'SwiftUI', 'AppKit', 'Unix sockets', 'Claude Code hooks', 'Shell', 'Node.js'],
  caseStudy: {
    hero: {
      src: diffRequest,
      alt: 'The notch grown into a card: Needs you, a countdown at 0:53, Edit Cart.tsx? with its six-line diff open beneath, and the keys Allow, Deny, Always and Diff',
      caption: 'A request to edit Cart.tsx, with the diff it would write open under the notch',
    },
    summary:
      'Claude Code works in a terminal you are not always looking at. notchcode puts its state, and its questions, in the one place on a MacBook that is always in view: the notch.',
    sections: [
      {
        heading: 'Why',
        body: [
          'Claude Code asks permission before it runs a command, edits a file or commits. When several sessions run at once, across worktrees and terminals, the question lands in a window you have switched away from, and the work stalls until you notice. The notch is the one strip of screen that is visible from every app and every space, so it became the doorbell: a request grows the notch to two rows, names what is being asked, and waits for one key.',
          'Two rules shaped the design. Closed, the notch has to look exactly like the hardware: pure black, the same radius, nothing drawn over the camera, so nothing is there until something needs you. And the app may act only through Claude Code’s own hooks. It never edits a file or runs a command on your behalf, never denies anything for you, and if you answer in the terminal instead the card simply folds away.',
        ],
        figure: {
          src: states,
          alt: 'Four menu bars: the bare notch closed; working with two agents; done with 3 files, +87 and −12; resting with one more session',
          caption: 'The traffic light: closed, working, done, resting',
        },
      },
      {
        heading: 'How it works',
        body: [
          'Claude Code writes every session to a JSON-lines file under ~/.claude/projects, and notchcode polls that folder every two seconds. That alone gives it the sessions, their prompts, the files they touched, their diffs, subagents, tokens and cost, with no setup. For the moments that need an answer, one shell script called by Claude Code’s hooks sends a single JSON line over a Unix socket; for a permission request, a git commit or a finished plan it waits for your key, and if the app is not running it prints nothing and exits. A third script chains in front of your status line and forwards the usage limits Claude Code hands it.',
          'Connect adds those hooks to ~/.claude/settings.json beside your own, backs the file up first, and Disconnect puts everything back. A Claude Code plugin does the same for one session without touching settings at all. The app is Swift and SwiftUI only, with every colour, radius, spring and glyph in one theme file, and the diff shown under a request is built from the exact text Claude wants to write.',
        ],
        figure: {
          src: cardSessions,
          alt: 'The open card on Sessions: two worktrees of one repository, one working in bypass mode with a subagent, one waiting for you, and a second repository idle',
          caption: 'Sessions: every live session by repository, one row per worktree',
        },
      },
      {
        heading: 'Git without leaving the notch',
        body: [
          'Press the notch and a card opens with five tools, picked with the number keys. The Git tool shows the uncommitted files of the worktree you are looking at and the diff of each, with line numbers, changed words lit and a minimap. Tick the files you want, press C, and the summary field docked under the list slides up into a commit form; ⏎ commits them. A pill publishes, pulls, pushes or fetches, co-authors are suggested from your recent commits and written as GitHub trailers, and after a commit an Undo stays available until you push. Any local branch of a repository a session runs in can be opened, and one checked out nowhere shows its changes against main, read-only.',
          'The Changes tool reads a session as a timeline, newest first, each turn that changed files with its files as chips and quiet turns folded away. Files is the repository tree with changed files badged and a preview that tints changed lines. Usage shows the 5-hour, weekly and per-model limits with their reset times, what the last call cached, and this session’s cost.',
        ],
        figure: {
          src: cardGit,
          alt: 'The Git tool: two uncommitted files and recent commits on the left, the diff of Cart.tsx with line numbers, lit words and a minimap on the right, and a Push 3 pill in the header',
          caption: 'Git: the checklist of uncommitted files, the selected diff, and the sync pill',
        },
      },
      {
        heading: 'Where it stands',
        body: [
          'It runs on the author’s machine, built from source with Xcode and XcodeGen, on any MacBook with a notch running macOS 14 or newer. The next steps are a notarised download and a Homebrew cask, open at login with a first-run welcome in the notch, the plugin on a marketplace, and a floating pill for displays without a notch. It is the sibling of sidecar-pane, which shows the same stream in a terminal split; they share a data contract, not code.',
        ],
      },
    ],
    details: [
      { label: 'Platform', value: 'macOS 14+, MacBooks with a notch' },
      { label: 'Year', value: '2026' },
    ],
    gallery: [
      {
        src: hero,
        alt: 'The notch grown to two rows: Needs you, a countdown at 0:53, and Allow Bash? npm test -- --watch=false, with the keys Allow, Deny and Always under it',
        caption: 'The doorbell: a Bash request, and the three keys that answer it',
      },
      {
        src: cardGitClean,
        alt: 'The Git tool with nothing to commit: a green check and the words Nothing to commit, up to date',
        caption: 'Git with nothing to commit',
      },
    ],
  },
};
