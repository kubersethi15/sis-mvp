// Kaya Bloom Mark — SVG Component
// Brand: Single node at centre (candidate) with 7 radiating lines to peer nodes.
// Two base nodes in Proof Green (jobseeker + employer connected).
// Remaining nodes in Navy 600 (the broader network).
// Source: Kaya_Brand_Guidelines_v1.0 §2

interface BloomMarkProps {
  size?: number;
  className?: string;
}

export default function BloomMark({ size = 28, className = '' }: BloomMarkProps) {
  const r = size / 2;
  const cx = r;
  const cy = r;
  const nodeR = size * 0.07;  // node radius
  const centerR = size * 0.1; // center node slightly larger
  const orbitR = r * 0.72;    // distance from center to outer nodes

  // 7 nodes arranged in a circle
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2; // start from top
    return {
      x: cx + orbitR * Math.cos(angle),
      y: cy + orbitR * Math.sin(angle),
      // Bottom two nodes (indices 3 and 4) are green — jobseeker + employer connected
      isGreen: i === 3 || i === 4,
    };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-label="Kaya bloom mark">
      {/* Lines from center to each node */}
      {nodes.map((node, i) => (
        <line
          key={`line-${i}`}
          x1={cx} y1={cy}
          x2={node.x} y2={node.y}
          stroke={node.isGreen ? '#48BB78' : '#486581'}
          strokeWidth={size * 0.025}
          strokeOpacity={node.isGreen ? 0.8 : 0.4}
        />
      ))}
      {/* Outer nodes */}
      {nodes.map((node, i) => (
        <circle
          key={`node-${i}`}
          cx={node.x} cy={node.y}
          r={nodeR}
          fill={node.isGreen ? '#48BB78' : '#486581'}
        />
      ))}
      {/* Center node — the candidate */}
      <circle cx={cx} cy={cy} r={centerR} fill="#F0F4F8" />
      <circle cx={cx} cy={cy} r={centerR * 0.6} fill="#48BB78" />
    </svg>
  );
}
