// Billable. mini-room: one playable room from the owner's own game (procedural pixel art, Phaser 3).
// The page ships only this poster, a Play button and the controls text. Phaser and the scene live
// in ./game and are fetched with a dynamic import() when the visitor presses Play
// (constitution art. 5: heavy demos load only on explicit user action).
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import posterUrl from './poster.png?url&no-inline';
import { touchInput, type Action } from './touch';
import type { GameHandle, GameHost } from './host';
import '../kit.css';
import './billable.css';

type Status = 'poster' | 'loading' | 'playing' | 'paused' | 'cleared' | 'error';

const MAX_HP = 8;
const billed = (h: number) => `${h} ${h === 1 ? 'hour' : 'hours'}`;

const PAD: { action: Action; label: string; glyph: string; area: string }[] = [
  { action: 'left', label: 'Move left', glyph: '◀', area: 'left' },
  { action: 'right', label: 'Move right', glyph: '▶', area: 'right' },
  { action: 'down', label: 'Down (pogo in the air)', glyph: '▼', area: 'down' },
  { action: 'attack', label: 'Attack', glyph: 'X', area: 'attack' },
  { action: 'jump', label: 'Jump', glyph: 'Jump', area: 'jump' },
];

export default function BillableMini() {
  const [status, setStatus] = useState<Status>('poster');
  const [hydrated, setHydrated] = useState(false);
  const [hours, setHours] = useState(0);
  const [hp, setHp] = useState(MAX_HP);
  const [clearedHours, setClearedHours] = useState(0);
  const [announce, setAnnounce] = useState('');
  const base = useId();
  const goalId = `${base}-goal`;
  const controlsId = `${base}-controls`;

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayButtonRef = useRef<HTMLButtonElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const statusRef = useRef<Status>('poster');
  const autoPausedRef = useRef(false);

  const go = useCallback((s: Status) => {
    statusRef.current = s;
    setStatus(s);
  }, []);

  useEffect(() => setHydrated(true), []);

  // Tear the game down if the island unmounts.
  useEffect(() => () => handleRef.current?.destroy(), []);

  // Focus follows state: into the game while playing, onto the overlay button otherwise. A pause
  // from focus leaving the game (below) leaves focus where the visitor sent it.
  useEffect(() => {
    if (status === 'playing') canvasRef.current?.focus();
    if (status === 'paused' && !rootRef.current?.contains(document.activeElement)) return;
    if (status === 'paused' || status === 'cleared' || status === 'error')
      overlayButtonRef.current?.focus();
  }, [status]);

  // Pause while scrolled out of view; pick up again when it comes back.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      const h = handleRef.current;
      if (!h) return;
      if (!entry.isIntersecting && statusRef.current === 'playing' && !autoPausedRef.current) {
        autoPausedRef.current = true;
        h.pause();
      } else if (entry.isIntersecting && autoPausedRef.current) {
        autoPausedRef.current = false;
        if (statusRef.current === 'playing') h.resume();
      }
    });
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  const host: GameHost = {
    reducedMotion:
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    onReady: () => go('playing'),
    onStatus: (s) => {
      setHours(s.hours);
      setHp(s.hp);
    },
    onAnnounce: setAnnounce,
    onCleared: (h) => {
      handleRef.current?.pause();
      setClearedHours(h);
      setAnnounce(`Room cleared. You billed ${billed(h)}.`);
      go('cleared');
    },
  };

  async function play() {
    if (statusRef.current === 'loading') return;
    go('loading');
    setAnnounce('Loading the game…');
    try {
      const mod = await import('./game/billable-game');
      // The canvas mounts with the loading state; wait a frame if React hasn't painted it yet.
      if (!canvasRef.current) await new Promise((r) => requestAnimationFrame(r));
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) throw new Error('canvas missing');
      handleRef.current = mod.startGame(canvas, stage, host);
      setAnnounce('Game started. Keyboard focus is in the game; press Escape to pause.');
    } catch (err) {
      console.error('[billable] game failed to start', err);
      go('error');
      setAnnounce('The game could not load.');
    }
  }

  function pause() {
    if (statusRef.current !== 'playing') return;
    handleRef.current?.pause();
    setAnnounce('Paused.');
    go('paused');
  }

  function resume() {
    autoPausedRef.current = false;
    handleRef.current?.resume();
    setAnnounce('Resumed.');
    go('playing');
  }

  function replay() {
    setHours(0);
    setHp(MAX_HP);
    setAnnounce('Replaying the room.');
    handleRef.current?.resume();
    handleRef.current?.replay();
  }

  // Pause when focus leaves the game (WO-025): Tab past it, or a click elsewhere on the page.
  // Focus moving within it (the Pause button, the on-screen pad) doesn't count. Checked a tick
  // later, once React has moved focus itself (Resume hands focus back to the canvas).
  function onBlur(e: FocusEvent<HTMLDivElement>) {
    if (statusRef.current !== 'playing') return;
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return;
    setTimeout(() => {
      const root = rootRef.current;
      if (root && !root.contains(document.activeElement)) pause();
    }, 0);
  }

  function onCanvasKey(e: KeyboardEvent<HTMLCanvasElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      pause();
    }
  }

  const press = (a: Action) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    touchInput.press(a);
  };
  const release = (a: Action) => () => touchInput.release(a);
  const keyPress = (a: Action) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
      e.preventDefault();
      touchInput.press(a);
    }
  };
  const keyRelease = (a: Action) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') touchInput.release(a);
  };

  const started = status !== 'poster' && status !== 'error';
  const live = status === 'playing' || status === 'paused';

  return (
    <div
      className="bm"
      ref={rootRef}
      data-hydrated={hydrated ? '' : undefined}
      data-status={status}
      onBlur={onBlur}
    >
      <div className="bm-main">
        <p className="bm-hud">
          <span className="bm-stat">
            Billable Hours <strong>{hours}</strong>
          </span>
          <span className="bm-stat">
            Wellbeing{' '}
            <strong>
              {hp}/{MAX_HP}
            </strong>
          </span>
          {live && (
            <button
              type="button"
              className="bm-btn bm-btn-small"
              onClick={status === 'paused' ? resume : pause}
            >
              {status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          )}
        </p>

        <div className="bm-stage" ref={stageRef}>
          {(status === 'poster' || status === 'loading' || status === 'error') && (
            <img
              className="bm-poster"
              src={posterUrl}
              width={400}
              height={224}
              alt="Pixel-art office at dusk: the Associate by the window, clock coins on two desks, a leaked email on the top desk and the Red Stapler on the floor."
            />
          )}
          {started && (
            <canvas
              ref={canvasRef}
              className="bm-canvas"
              tabIndex={0}
              role="application"
              aria-label="Billable. mini-room game"
              aria-describedby={`${goalId} ${controlsId}`}
              onKeyDown={onCanvasKey}
            />
          )}

          {status === 'poster' && (
            <div className="bm-overlay bm-overlay-clear">
              <button type="button" className="bm-btn bm-btn-play" onClick={play}>
                Play<span className="bm-sr"> the Billable. mini-room</span>
              </button>
            </div>
          )}
          {status === 'loading' && (
            <div className="bm-overlay bm-overlay-clear">
              <p className="bm-chip">Loading the game…</p>
            </div>
          )}
          {status === 'error' && (
            <div className="bm-overlay">
              <p className="bm-overlay-title">The game couldn’t load.</p>
              <button type="button" className="bm-btn" ref={overlayButtonRef} onClick={play}>
                Try again
              </button>
            </div>
          )}
          {status === 'paused' && (
            <div className="bm-overlay">
              <p className="bm-overlay-title">Paused</p>
              <button type="button" className="bm-btn" ref={overlayButtonRef} onClick={resume}>
                Resume
              </button>
            </div>
          )}
          {status === 'cleared' && (
            <div className="bm-overlay">
              <p className="bm-overlay-title">Room cleared</p>
              <p>You billed {billed(clearedHours)}.</p>
              <button type="button" className="bm-btn" ref={overlayButtonRef} onClick={replay}>
                Replay
              </button>
            </div>
          )}
        </div>

        {live && (
          <div className="bm-pad" role="group" aria-label="On-screen controls">
            {PAD.map((b) => (
              <button
                key={b.action}
                type="button"
                className={`bm-pad-btn bm-pad-${b.area}`}
                aria-label={b.label}
                disabled={status === 'paused'}
                onPointerDown={press(b.action)}
                onPointerUp={release(b.action)}
                onPointerCancel={release(b.action)}
                onLostPointerCapture={release(b.action)}
                onMouseDown={(e) => e.preventDefault()}
                onKeyDown={keyPress(b.action)}
                onKeyUp={keyRelease(b.action)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <span aria-hidden="true">{b.glyph}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bm-info">
        <div className="bm-goal">
          <h3 className="bm-h">Goal</h3>
          <p id={goalId}>
            Collect the Billable Hours (the clock coins), open the Leaked Email on the top desk,
            then defeat the Red Stapler that patrols the floor. Two laptop swings or pogo bounces
            finish it.
          </p>
        </div>
        <div className="bm-controls">
          <h3 className="bm-h">Controls</h3>
          <dl className="bm-keys" id={controlsId}>
            <div>
              <dt>Move</dt>
              <dd>
                <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>
              </dd>
            </div>
            <div>
              <dt>Jump</dt>
              <dd>
                <kbd>Space</kbd> or <kbd>Z</kbd>{' '}
                <span className="bm-note">hold to jump higher</span>
              </dd>
            </div>
            <div>
              <dt>Attack</dt>
              <dd>
                <kbd>X</kbd> <span className="bm-note">laptop swing</span>
              </dd>
            </div>
            <div>
              <dt>Pogo</dt>
              <dd>
                Hold <kbd>Down</kbd> or <kbd>S</kbd> <span className="bm-note">in the air</span>
              </dd>
            </div>
            <div>
              <dt>Drop through a desk</dt>
              <dd>
                <kbd>Down</kbd> + <kbd>Jump</kbd>
              </dd>
            </div>
            <div>
              <dt>Pause</dt>
              <dd>
                <kbd>Esc</kbd> <span className="bm-note">returns focus to the page</span>
              </dd>
            </div>
            <div className="bm-keys-touch">
              <dt>Touch</dt>
              <dd>On-screen buttons under the game</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="bm-sr" role="status">
        {announce}
      </p>
    </div>
  );
}
