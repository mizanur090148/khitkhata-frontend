import React, { useMemo } from 'react';
import { buildDeterministicQrMatrix } from '@/utils/formatters';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 110,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  className = '',
}) => {
  const matrix = useMemo(() => buildDeterministicQrMatrix(value), [value]);
  const n = matrix.length;
  const cellSize = size / n;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ background: bgColor, borderRadius: 6, padding: 4 }}
    >
      <rect width={size} height={size} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell === 1 ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.2}
              height={cellSize + 0.2}
              fill={fgColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};

