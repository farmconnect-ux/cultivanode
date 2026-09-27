import { brand } from '@cultivanode/shared/brand';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/** The CultivaNode mark, drawn from the shapes in packages/shared/src/brand.ts (single source). */
export function Logo({ size = 56, background = true }: { size?: number; background?: boolean }) {
  const l = brand.logo;
  return (
    <Svg width={size} height={size} viewBox={l.viewBox} accessibilityLabel={brand.name} accessibilityRole="image">
      {background ? <Rect width={40} height={40} rx={10} fill={l.background} /> : null}
      {l.shapes.map((s, i) =>
        s.kind === 'circle' ? (
          <Circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} />
        ) : (
          <Path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.stroke}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={'opacity' in s ? s.opacity : 1}
          />
        ),
      )}
    </Svg>
  );
}
