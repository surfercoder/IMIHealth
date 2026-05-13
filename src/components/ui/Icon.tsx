import { JSX } from "react";
import Svg, { Circle, Path, Rect, SvgProps } from "react-native-svg";

export type IconName =
  | "add"
  | "alert-circle"
  | "alert-circle-outline"
  | "arrow-back"
  | "brush-outline"
  | "camera-outline"
  | "camera-reverse-outline"
  | "checkmark"
  | "checkmark-circle"
  | "checkmark-circle-outline"
  | "chevron-down"
  | "chevron-forward"
  | "clipboard-outline"
  | "close"
  | "close-circle"
  | "copy-outline"
  | "create-outline"
  | "document-text"
  | "document-text-outline"
  | "documents-outline"
  | "eye-off-outline"
  | "eye-outline"
  | "flash"
  | "language"
  | "log-out-outline"
  | "logo-whatsapp"
  | "mail-open-outline"
  | "mail-outline"
  | "mic"
  | "people"
  | "people-outline"
  | "refresh"
  | "search"
  | "stats-chart-outline"
  | "time-outline"
  | "trash-outline"
  | "warning";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  onPress?: () => void;
}

export function Icon({ name, size = 24, color = "#000", onPress }: IconProps): JSX.Element {
  const stroke = color;
  const common: SvgProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    onPress,
  };
  const lineProps = {
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const filledProps = { fill: color };

  switch (name) {
    case "add":
      return (
        <Svg {...common}>
          <Path d="M12 5v14M5 12h14" {...lineProps} />
        </Svg>
      );
    case "alert-circle":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...filledProps} />
          <Path d="M12 8v4M12 16h.01" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case "alert-circle-outline":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...lineProps} />
          <Path d="M12 8v4M12 16h.01" {...lineProps} />
        </Svg>
      );
    case "arrow-back":
      return (
        <Svg {...common}>
          <Path d="M19 12H5M12 19l-7-7 7-7" {...lineProps} />
        </Svg>
      );
    case "brush-outline":
      return (
        <Svg {...common}>
          <Path
            d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08-4.04-4.05ZM7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02Z"
            {...lineProps}
          />
        </Svg>
      );
    case "camera-outline":
      return (
        <Svg {...common}>
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...lineProps} />
          <Circle cx={12} cy={13} r={4} {...lineProps} />
        </Svg>
      );
    case "camera-reverse-outline":
      return (
        <Svg {...common}>
          <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...lineProps} />
          <Path d="M9 13a3 3 0 0 1 5-2.2M15 13a3 3 0 0 1-5 2.2M10 10l-1 1 1 1M14 16l1-1-1-1" {...lineProps} />
        </Svg>
      );
    case "checkmark":
      return (
        <Svg {...common}>
          <Path d="M20 6L9 17l-5-5" {...lineProps} />
        </Svg>
      );
    case "checkmark-circle":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...filledProps} />
          <Path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case "checkmark-circle-outline":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...lineProps} />
          <Path d="M8 12l3 3 5-6" {...lineProps} />
        </Svg>
      );
    case "chevron-down":
      return (
        <Svg {...common}>
          <Path d="M6 9l6 6 6-6" {...lineProps} />
        </Svg>
      );
    case "chevron-forward":
      return (
        <Svg {...common}>
          <Path d="M9 18l6-6-6-6" {...lineProps} />
        </Svg>
      );
    case "clipboard-outline":
      return (
        <Svg {...common}>
          <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...lineProps} />
          <Rect width={8} height={4} x={8} y={2} rx={1} ry={1} {...lineProps} />
        </Svg>
      );
    case "close":
      return (
        <Svg {...common}>
          <Path d="M18 6L6 18M6 6l12 12" {...lineProps} />
        </Svg>
      );
    case "close-circle":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...filledProps} />
          <Path d="M15 9l-6 6M9 9l6 6" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case "copy-outline":
      return (
        <Svg {...common}>
          <Rect width={13} height={13} x={9} y={9} rx={2} ry={2} {...lineProps} />
          <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...lineProps} />
        </Svg>
      );
    case "create-outline":
      return (
        <Svg {...common}>
          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" {...lineProps} />
          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" {...lineProps} />
        </Svg>
      );
    case "document-text":
      return (
        <Svg {...common}>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...filledProps} />
          <Path d="M14 2v6h6" stroke="#fff" strokeWidth={2} fill="none" strokeLinejoin="round" />
          <Path d="M16 13H8M16 17H8M10 9H8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case "document-text-outline":
      return (
        <Svg {...common}>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...lineProps} />
          <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" {...lineProps} />
        </Svg>
      );
    case "documents-outline":
      return (
        <Svg {...common}>
          <Path d="M14 1H4a2 2 0 0 0-2 2v14h2V3h10z" {...lineProps} />
          <Path d="M18 5H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" {...lineProps} />
          <Path d="M18 5v4h4" {...lineProps} />
        </Svg>
      );
    case "eye-off-outline":
      return (
        <Svg {...common}>
          <Path
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
            {...lineProps}
          />
        </Svg>
      );
    case "eye-outline":
      return (
        <Svg {...common}>
          <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...lineProps} />
          <Circle cx={12} cy={12} r={3} {...lineProps} />
        </Svg>
      );
    case "flash":
      return (
        <Svg {...common}>
          <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" {...filledProps} />
        </Svg>
      );
    case "language":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...lineProps} />
          <Path d="M2 12h20" {...lineProps} />
          <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" {...lineProps} />
        </Svg>
      );
    case "log-out-outline":
      return (
        <Svg {...common}>
          <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...lineProps} />
          <Path d="M16 17l5-5-5-5M21 12H9" {...lineProps} />
        </Svg>
      );
    case "logo-whatsapp":
      return (
        <Svg {...common}>
          <Path
            d="M20.5 3.5A9.93 9.93 0 0 0 12.04 0a10 10 0 0 0-8.7 14.94L2 22l7.2-1.9a10 10 0 0 0 14.8-8.62 9.93 9.93 0 0 0-3.5-7.98zM12.04 18.3a8.3 8.3 0 0 1-4.22-1.15l-.3-.18-3 .8.8-2.92-.2-.3a8.3 8.3 0 1 1 6.92 3.75zm4.55-6.22c-.25-.13-1.48-.73-1.7-.81-.23-.08-.4-.13-.57.13-.17.25-.66.81-.81.98-.15.17-.3.19-.55.06-.25-.13-1.06-.39-2.02-1.25-.75-.66-1.25-1.48-1.4-1.73-.15-.25-.02-.39.1-.51.11-.11.25-.3.37-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.87-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.45.06-.68.32-.23.25-.89.87-.89 2.12s.91 2.46 1.04 2.63c.13.17 1.79 2.73 4.34 3.83.61.26 1.08.42 1.45.54.61.19 1.16.16 1.6.1.49-.07 1.48-.6 1.69-1.19.21-.59.21-1.09.15-1.19-.06-.1-.23-.16-.48-.29z"
            {...filledProps}
          />
        </Svg>
      );
    case "mail-open-outline":
      return (
        <Svg {...common}>
          <Path d="M2 8.5l10 6 10-6" {...lineProps} />
          <Path d="M22 8.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.5l10-6.5 10 6.5z" {...lineProps} />
        </Svg>
      );
    case "mail-outline":
      return (
        <Svg {...common}>
          <Rect width={20} height={16} x={2} y={4} rx={2} {...lineProps} />
          <Path d="M22 6l-10 7L2 6" {...lineProps} />
        </Svg>
      );
    case "mic":
      return (
        <Svg {...common}>
          <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" {...filledProps} />
          <Path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" {...lineProps} />
        </Svg>
      );
    case "people":
      return (
        <Svg {...common}>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...filledProps} />
          <Circle cx={9} cy={7} r={4} {...filledProps} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...filledProps} />
        </Svg>
      );
    case "people-outline":
      return (
        <Svg {...common}>
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...lineProps} />
          <Circle cx={9} cy={7} r={4} {...lineProps} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" {...lineProps} />
        </Svg>
      );
    case "refresh":
      return (
        <Svg {...common}>
          <Path d="M23 4v6h-6M1 20v-6h6" {...lineProps} />
          <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...lineProps} />
        </Svg>
      );
    case "search":
      return (
        <Svg {...common}>
          <Circle cx={11} cy={11} r={8} {...lineProps} />
          <Path d="M21 21l-4.35-4.35" {...lineProps} />
        </Svg>
      );
    case "stats-chart-outline":
      return (
        <Svg {...common}>
          <Path d="M3 3v18h18" {...lineProps} />
          <Path d="M7 16V8M11 16V4M15 16v-6M19 16v-3" {...lineProps} />
        </Svg>
      );
    case "time-outline":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={10} {...lineProps} />
          <Path d="M12 6v6l4 2" {...lineProps} />
        </Svg>
      );
    case "trash-outline":
      return (
        <Svg {...common}>
          <Path d="M3 6h18" {...lineProps} />
          <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...lineProps} />
          <Path d="M10 11v6M14 11v6" {...lineProps} />
        </Svg>
      );
    case "warning":
      return (
        <Svg {...common}>
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" {...filledProps} />
          <Path d="M12 9v4M12 17h.01" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
  }
}
