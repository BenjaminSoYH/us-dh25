import React, { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import StreakNumber from './StreakNumber';
import Svg, { Path, Defs, ClipPath, G } from 'react-native-svg';

type HeartBoxProps = {
  width: number;
  height: number;
  percentage: number; // 0..100
  value?: number; // small number to display at bottom of heart
};

// Build a simple sine wave path in a 0..100 horizontal coordinate system
function buildWavePathVB(baseline: number, amplitude: number, waves = 3, steps = 80, phase = 0) {
  // sample points along the sine wave with phase offset
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const t = (i / steps) * waves * Math.PI * 2;
    const y = baseline + Math.sin(t + phase) * amplitude;
    pts.push({ x, y });
  }

  // convert sampled points into a smooth path using quadratic bezier segments
  let d = '';
  if (pts.length > 0) {
    d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cx = ((prev.x + curr.x) / 2).toFixed(2);
      const cy = ((prev.y + curr.y) / 2).toFixed(2);
      d += ` Q ${prev.x.toFixed(2)} ${prev.y.toFixed(2)} ${cx} ${cy}`;
    }
    // line down to bottom and close
    d += ` L 100 100 L 0 100 Z`;
  }

  return d;
}

export default function HeartBox({ width, height, percentage, value }: HeartBoxProps) {
  const p = Math.max(0, Math.min(100, percentage));

  // animation phase (radians)
  const [phase, setPhase] = useState(0);
  const rafRef = useRef<number | null>(null);


  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setPhase((prev) => prev + dt * 0.004);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);


  // In the SVG viewBox 0..100, baseline y (0 top, 100 bottom)
  const baseline = 100 - p; // 0% -> 100, 100% -> 0
  const amplitude = Math.max(1.5, Math.min(6, (100 / 100) * 3));

  const waveD = buildWavePathVB(baseline, amplitude, 3, 80, phase);

  // Simple heart path in normalized 0..100 coords
  const heartPath = 'M50 15 C35 0, 0 25, 50 62 C100 25, 65 0, 50 15 Z';


  return (
    <View style={{ width, height, position: 'relative' }}>
      <Svg width={width} height={height} viewBox="0 0 100 100">
        <Defs>
          <ClipPath id="heartClip">
            <Path d={heartPath} />
          </ClipPath>
        </Defs>

        {/* Heart outline */}
        <G>
          <Path d={heartPath} fill="#fff" stroke="#ff80b3" strokeWidth={1.2} />
        </G>

        {/* Pink water, clipped to heart */}
        <G clipPath="url(#heartClip)">
          <Path d={waveD} fill="#ff9ac8" opacity={0.98} />
        </G>
      </Svg>

    </View>
  );
}
