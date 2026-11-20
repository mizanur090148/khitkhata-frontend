import React, { useEffect, useRef } from 'react';

interface KnittedKCanvasProps {
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export const KnittedKCanvas: React.FC<KnittedKCanvasProps> = ({
  size = 36,
  fgColor = '#0d6e4f',
  bgColor = 'transparent',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, size, size);

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw stylized knitted 'K' emblem
    ctx.strokeStyle = fgColor;
    ctx.lineWidth = Math.max(2, size / 10);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const p = size * 0.2;
    const w = size * 0.6;
    const h = size * 0.6;

    // Vertical backbone
    ctx.beginPath();
    ctx.moveTo(p + w * 0.2, p);
    ctx.lineTo(p + w * 0.2, p + h);
    ctx.stroke();

    // Top diagonal
    ctx.beginPath();
    ctx.moveTo(p + w * 0.2, p + h * 0.5);
    ctx.lineTo(p + w * 0.85, p);
    ctx.stroke();

    // Bottom diagonal
    ctx.beginPath();
    ctx.moveTo(p + w * 0.35, p + h * 0.38);
    ctx.lineTo(p + w * 0.85, p + h);
    ctx.stroke();

    // Loop accents (yarn stitch loops)
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.arc(p + w * 0.2, p, size / 16, 0, Math.PI * 2);
    ctx.arc(p + w * 0.2, p + h, size / 16, 0, Math.PI * 2);
    ctx.arc(p + w * 0.85, p, size / 16, 0, Math.PI * 2);
    ctx.arc(p + w * 0.85, p + h, size / 16, 0, Math.PI * 2);
    ctx.fill();
  }, [size, fgColor, bgColor]);

  return <canvas ref={canvasRef} width={size} height={size} className={className} />;
};

