import { useEffect, useState, useRef } from "react";
import paw from "../images/paws.png"; // 👈 your paw image

// Quadratic Bézier position
function bezier2(t, p0, p1, p2) {
  const u = 1 - t;
  const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  return { x, y };
}

// Quadratic Bézier derivative (tangent)
function bezier2d(t, p0, p1, p2) {
  const x = 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const y = 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return { x, y };
}

export default function Footsteps() {
  const [steps, setSteps] = useState([]);
  const pathIndexRef = useRef(0);      // 0 = Path A, 1 = Path B
  const tRef = useRef(0);              // param along current path
  const isLeftRef = useRef(true);      // alternate left/right
  const rafId = useRef(null);
  const lastSpawn = useRef(0);

  // Tunables
  const paceMs = 300;     // time between steps
  const tStep = 0.035;    // spacing along the curve (smaller = closer steps)
  const stepOffset = 12;  // px perpendicular offset for L/R feet
  const maxSteps = 10;    // length of visible trail

  useEffect(() => {
    function spawnStep(now) {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Define the two paths exactly as requested
      // Path A: middle-left -> middle-top (arc up-right)
      const A0 = { x: 0,     y: h / 2 };
      const A2 = { x: w / 2, y: 0 };
      const A1 = {           // control point to arch upward
        x: w * 0.18,
        y: h * 0.18,
      };

      // Path B: middle-bottom -> middle-right (arc up-right)
      const B0 = { x: w / 2, y: h };
      const B2 = { x: w,     y: h / 2 };
      const B1 = {           // control point to arch upward toward right
        x: w * 0.82,
        y: h * 0.62,
      };

      const isPathA = pathIndexRef.current === 0;
      const p0 = isPathA ? A0 : B0;
      const p1 = isPathA ? A1 : B1;
      const p2 = isPathA ? A2 : B2;

      const t = tRef.current;
      const pos = bezier2(t, p0, p1, p2);
      const tan = bezier2d(t, p0, p1, p2);

      // Angle of tangent (for rotation)
      const angle = Math.atan2(tan.y, tan.x);

      // Perpendicular unit vector (normal)
      const len = Math.hypot(tan.x, tan.y) || 1;
      const nx = -tan.y / len;
      const ny = tan.x / len;

      // Alternate left/right around the curve
      const side = isLeftRef.current ? -1 : 1; // -1 left, 1 right
      const px = pos.x + side * stepOffset * nx;
      const py = pos.y + side * stepOffset * ny;

      // Slight angle bias per foot so prints feel more natural
      const deg = (angle * 180) / Math.PI + (isLeftRef.current ? -10 : 10);

      const newStep = {
        id: `${isPathA ? "A" : "B"}-${now}`,
        left: px,
        top: py,
        rotate: deg,
      };

      setSteps((prev) => [...prev, newStep].slice(-maxSteps));

      // advance along the curve & alternate foot
      tRef.current += tStep;
      isLeftRef.current = !isLeftRef.current;

      // when one path completes, swap to the other and reset t
      if (tRef.current >= 1) {
        tRef.current = 0;
        pathIndexRef.current = isPathA ? 1 : 0;
      }
    }

    function loop(now) {
      if (now - lastSpawn.current >= paceMs) {
        spawnStep(now);
        lastSpawn.current = now;
      }
      rafId.current = requestAnimationFrame(loop);
    }

    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  return (
  <div className="absolute inset-0 pointer-events-none z-9999">
      {steps.map((s) => (
        <img
          key={s.id}
          src={paw}
          alt="paw step"
          className="absolute opacity-60 animate-fadeTrail"
          style={{
            width: "28px",
            height: "28px",
            left: `${s.left}px`,
            top: `${s.top}px`,
            transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
