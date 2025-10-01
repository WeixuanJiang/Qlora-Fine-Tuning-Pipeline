import React from 'react';
import { Icon, IconProps } from '@chakra-ui/react';

// Custom geometric icon components to replace react-icons

export const HomeIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 2L2 7v10c0 5.55 3.84 10 9 11 5.16-1 9-5.45 9-11V7l-10-5z"
    />
    <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.3" />
  </Icon>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <polygon
      fill="currentColor"
      points="8,5 19,12 8,19"
    />
    <circle cx="8" cy="12" r="2" fill="white" fillOpacity="0.4" />
  </Icon>
);

export const EditIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
    <rect x="6" y="8" width="12" height="2" fill="white" fillOpacity="0.7" />
    <rect x="6" y="12" width="8" height="2" fill="white" fillOpacity="0.5" />
    <rect x="6" y="16" width="10" height="2" fill="white" fillOpacity="0.3" />
  </Icon>
);

export const TargetIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
  </Icon>
);

export const TrendingUpIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 7h4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const FileTextIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 13h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const ChartIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="12" width="4" height="9" fill="currentColor" />
    <rect x="10" y="8" width="4" height="13" fill="currentColor" />
    <rect x="17" y="4" width="4" height="17" fill="currentColor" />
    <circle cx="5" cy="10" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="12" cy="6" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="19" cy="2" r="2" fill="white" fillOpacity="0.6" />
  </Icon>
);

export const MergeIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M6 2L12 8L18 2L20 4L14 10L20 16L18 18L12 12L6 18L4 16L10 10L4 4L6 2Z"
    />
    <circle cx="12" cy="10" r="2" fill="white" fillOpacity="0.5" />
  </Icon>
);

export const ListIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="4" width="18" height="3" rx="1.5" fill="currentColor" />
    <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor" />
    <rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor" />
    <circle cx="6" cy="5.5" r="1" fill="white" fillOpacity="0.7" />
    <circle cx="6" cy="12" r="1" fill="white" fillOpacity="0.7" />
    <circle cx="6" cy="18.5" r="1" fill="white" fillOpacity="0.7" />
  </Icon>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <circle cx="12" cy="12" r="6" fill="white" fillOpacity="0.2" />
    <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.4" />
    <rect x="11" y="2" width="2" height="4" fill="white" fillOpacity="0.8" />
    <rect x="11" y="18" width="2" height="4" fill="white" fillOpacity="0.8" />
    <rect x="2" y="11" width="4" height="2" fill="white" fillOpacity="0.8" />
    <rect x="18" y="11" width="4" height="2" fill="white" fillOpacity="0.8" />
  </Icon>
);

export const ActivityIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M2 12L6 8L10 16L14 4L18 12L22 8V20H2V12Z"
    />
    <circle cx="6" cy="8" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="10" cy="16" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="14" cy="4" r="2" fill="white" fillOpacity="0.6" />
    <circle cx="18" cy="12" r="2" fill="white" fillOpacity="0.6" />
  </Icon>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path
      d="M8 12L11 15L16 9"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);

export const AlertIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <polygon
      fill="currentColor"
      points="12,2 22,20 2,20"
    />
    <circle cx="12" cy="16" r="1.5" fill="white" />
    <rect x="11" y="8" width="2" height="6" fill="white" />
  </Icon>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <circle cx="12" cy="12" r="7" fill="white" fillOpacity="0.2" />
    <path
      d="M12 6V12L16 16"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);

export const XIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <path
      d="M8 8L16 16M16 8L8 16"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      fill="none"
    />
  </Icon>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="6" y="4" width="4" height="16" rx="2" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" rx="2" fill="currentColor" />
  </Icon>
);

export const InfoIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" fill="currentColor" />
    <circle cx="12" cy="8" r="1.5" fill="white" />
    <rect x="11" y="11" width="2" height="8" fill="white" />
  </Icon>
);

export const SunIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="5" fill="currentColor" />
    <path
      d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Icon>
);

export const MoonIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79Z"
    />
    <circle cx="16" cy="8" r="1" fill="white" fillOpacity="0.6" />
    <circle cx="14" cy="6" r="0.5" fill="white" fillOpacity="0.4" />
    <circle cx="18" cy="10" r="0.5" fill="white" fillOpacity="0.4" />
  </Icon>
);

export const GithubIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10Z"
    />
  </Icon>
);

export const HeartIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78Z"
    />
  </Icon>
);

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" />
    <path
      d="M10 6H6V18H18V14M14 4H20V10M20 4L10 14"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      d="M9 18L15 12L9 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);

export const MenuIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
    <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
    <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
  </Icon>
);

export const CloseIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);

// System and Hardware Icons
export const CpuIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor"/>
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </Icon>
);

export const HardDriveIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="2" y="6" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M6 12h.01M10 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <rect x="4" y="8" width="16" height="2" fill="currentColor" opacity="0.3"/>
  </Icon>
);

export const ServerIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="2" y="3" width="20" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
    <rect x="2" y="10" width="20" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
    <rect x="2" y="17" width="20" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="5" r="1" fill="currentColor"/>
    <circle cx="6" cy="12" r="1" fill="currentColor"/>
    <circle cx="6" cy="19" r="1" fill="currentColor"/>
  </Icon>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="currentColor" strokeWidth="2"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" fill="none" stroke="currentColor" strokeWidth="2"/>
    <ellipse cx="12" cy="12" rx="6" ry="2" fill="currentColor" opacity="0.3"/>
  </Icon>
);

// Alternate trend icon with accent dots for richer visuals
export const TrendingUpSparkIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 7h4v4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="11" r="2" fill="currentColor" opacity="0.6"/>
    <circle cx="13" cy="15" r="2" fill="currentColor" opacity="0.6"/>
  </Icon>
);

// Additional Action Icons
export const StopIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
  </Icon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </Icon>
);

export const MoreVerticalIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </Icon>
);

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M23 4v6h-6M1 20v-6h6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 003.51 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </Icon>
);

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const FilterIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  </Icon>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" fill="none" />
  </Icon>
);

export const ZapIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Icon>
);

export const TypeIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <polyline points="4,7 4,4 20,4 20,7" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="9" y1="20" x2="15" y2="20" stroke="currentColor" strokeWidth="2" />
    <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const WifiIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const ShieldIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const MonitorIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
  </Icon>
);

export const GlobeIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" fill="none"/>
  </Icon>
);

export const MailIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const BellIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const KeyIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const LockIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const EyeOffIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

// Outline-style edit icon to complement the filled version near the top of the file
export const EditOutlineIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </Icon>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" fill="none" />
    <polyline points="7,10 12,5 17,10" stroke="currentColor" strokeWidth="2" fill="none" />
    <line x1="12" y1="5" x2="12" y2="15" stroke="currentColor" strokeWidth="2" />
  </Icon>
);

export const LayersIcon: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      d="M12 2L2 7l10 5 10-5-10-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M2 17l10 5 10-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M2 12l10 5 10-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Icon>
);
