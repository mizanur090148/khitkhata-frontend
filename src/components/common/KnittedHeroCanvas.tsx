import React, { useEffect, useRef } from 'react';

export const KnittedHeroCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext('2d');
    if (!cx) return;

    const K = [
      '0000000000000',
      '0110000001100',
      '0110000011000',
      '0110000110000',
      '0110001100000',
      '0110011000000',
      '0110110000000',
      '0111100000000',
      '0110110000000',
      '0110011000000',
      '0110001100000',
      '0110000110000',
      '0110000011000',
      '0110000001100',
      '0000000000000',
    ].map((r) => [...r].map(Number));

    const C = 13;
    const R = 15;
    const N = C * R;
    let W = 0;
    let H = 0;
    let cw = 0;
    let ch = 0;
    let ox = 0;
    let oy = 0;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function size() {
      if (!cv || !cx) return;
      const r = cv.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = r.width * d;
      cv.height = r.height * d;
      cx.setTransform(d, 0, 0, d, 0, 0);
      W = r.width;
      H = r.height;
      cw = (W * 0.8) / C;
      ch = cw * 0.86;
      ox = (W - cw * C) / 2;
      oy = (H - ch * R) / 2;
    }

    size();
    window.addEventListener('resize', size);

    // knitting order: bottom row first, back and forth like a carriage
    const order: [number, number][] = [];
    for (let r = R - 1; r >= 0; r--) {
      const row = [...Array(C).keys()];
      if ((R - 1 - r) % 2) row.reverse();
      row.forEach((c) => order.push([r, c]));
    }

    function stitch(x: number, y: number, w: number, h: number, col: string, a: number, s: number) {
      if (!cx) return;
      cx.save();
      cx.globalAlpha = a;
      cx.translate(x + w / 2, y + h / 2);
      cx.scale(s, s);
      cx.strokeStyle = col;
      cx.lineWidth = Math.max(1.6, w * 0.15);
      cx.lineCap = 'round';
      for (const k of [-1, 1]) {
        cx.beginPath();
        cx.ellipse(k * w * 0.2, 0, w * 0.2, h * 0.52, k * -0.42, 0, Math.PI * 2);
        cx.stroke();
      }
      cx.restore();
    }

    const SPEED = reduce ? 1e9 : 14;
    let t0 = performance.now();
    let animId: number;

    function frame(now: number) {
      if (!cx) return;
      const el = Math.max(0, (now - t0) / 1000);
      const n = Math.min(N, el * SPEED);
      const hold = N / SPEED + 2.6;

      cx.clearRect(0, 0, W, H);

      // yarn cone at bottom-right
      const conX = W - 18;
      const conY = H - 10;

      for (let i = 0; i < N; i++) {
        const [r, c] = order[i];
        const x = ox + c * cw;
        const y = oy + r * ch;
        const on = K[r][c];
        const p = Math.max(0, Math.min(1, n - i));

        if (p <= 0) {
          stitch(x, y, cw, ch, 'rgba(255,255,255,1)', 0.07, 1);
          continue;
        }

        const glow = on && el > N / SPEED ? 0.85 + 0.15 * Math.sin(now / 300 + (r + c) * 0.5) : 1;
        stitch(x, y, cw, ch, on ? '#FDE68A' : '#FFFFFF', on ? glow : 0.32, 0.6 + 0.4 * p);
      }

      if (n < N) {
        const [r, c] = order[Math.floor(n)];
        const x = ox + c * cw + cw / 2;
        const y = oy + r * ch + ch / 2;

        cx.save();
        cx.strokeStyle = 'rgba(253,230,138,.9)';
        cx.lineWidth = 1.6;
        cx.beginPath();
        cx.moveTo(conX, conY);
        cx.quadraticCurveTo((conX + x) / 2, Math.max(conY, y) + 30, x, y);
        cx.stroke();

        cx.fillStyle = '#FDE68A';
        cx.beginPath();
        cx.arc(x, y, 3.5, 0, Math.PI * 2);
        cx.fill();
        cx.restore();
      }

      // cone
      cx.save();
      cx.fillStyle = 'rgba(255,255,255,.9)';
      cx.beginPath();
      cx.moveTo(conX - 10, conY);
      cx.lineTo(conX + 10, conY);
      cx.lineTo(conX + 5, conY - 26);
      cx.lineTo(conX - 5, conY - 26);
      cx.closePath();
      cx.fill();

      cx.fillStyle = '#FDE68A';
      cx.fillRect(conX - 7, conY - 22, 14, 14);
      cx.restore();

      if (!reduce && el > hold) {
        t0 = now;
      }

      if (!reduce) {
        animId = requestAnimationFrame(frame);
      }
    }

    if (reduce) {
      frame(performance.now() + 1e12);
    } else {
      animId = requestAnimationFrame(frame);
    }

    return () => {
      window.removeEventListener('resize', size);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} id="knit" />;
};

