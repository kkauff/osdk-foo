import React, { useState } from "react";
import { Pie } from "@visx/shape";
import { Group } from "@visx/group";

export interface LinkTypeOption {
  apiName: string;
  displayName: string;
  multiplicity: boolean; // true = many, false = one
}

interface RadialMenuProps {
  x: number;
  y: number;
  linkTypes: LinkTypeOption[];
  onSelect: (linkType: LinkTypeOption) => void;
  radius?: number;
}

const RadialMenu: React.FC<RadialMenuProps> = ({
  x,
  y,
  linkTypes,
  onSelect,
  radius = 80,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (linkTypes.length === 0) return null;

  const innerRadius = radius * 0.6;
  const outerRadius = radius;

  return (
    <Group top={y} left={x}>
      {/* Connection indicator circle */}
      <circle
        r={innerRadius - 5}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth={1}
        strokeDasharray="3,3"
        opacity={0.5}
      />

      {/* Link type arcs using visx Pie */}
      <Pie
        data={linkTypes}
        pieValue={() => 1}
        outerRadius={outerRadius}
        innerRadius={innerRadius}
        cornerRadius={3}
        padAngle={0.02}
      >
        {(pie) => {
          return pie.arcs.map((arc, index) => {
            const [centroidX, centroidY] = pie.path.centroid(arc);
            const isHovered = hoveredIndex === index;

            return (
              <g key={`arc-${arc.data.apiName}`}>
                <path
                  d={pie.path(arc) || undefined}
                  fill="var(--node-color)"
                  stroke="var(--text-color)"
                  strokeWidth={isHovered ? 3 : 2}
                  opacity={isHovered ? 1 : 0.8}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(arc.data);
                  }}
                />
                {/* Label */}
                <text
                  x={centroidX}
                  y={centroidY}
                  textAnchor="middle"
                  dy=".33em"
                  fontSize={11}
                  fontWeight="bold"
                  fill="var(--text-color)"
                  pointerEvents="none"
                  style={{ userSelect: 'none' }}
                >
                  {arc.data.displayName.length > 12
                    ? arc.data.displayName.substring(0, 12) + '...'
                    : arc.data.displayName}
                </text>
              </g>
            );
          });
        }}
      </Pie>

      {/* Center instruction */}
      <text
        textAnchor="middle"
        dy=".33em"
        fontSize={10}
        fill="var(--secondary-text-color)"
        pointerEvents="none"
      >
        Click link
      </text>
    </Group>
  );
};

export default RadialMenu;
