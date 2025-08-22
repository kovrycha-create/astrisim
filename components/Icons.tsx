import React from 'react';

const iconProps = {
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
};

export const PlayIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const PauseIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SunIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export const MoonIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

export const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

export const FightIcon: React.FC<{className?: string}> = ({className}) => (
    <svg {...iconProps} strokeWidth="1.5" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15" />
    </svg>
);

export const ChevronLeftIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

export const ChevronRightIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);

export const ChevronUpIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const EyeIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const EyeOffIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" />
    </svg>
);

export const CrownIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5,16L3,5L8.5,12L12,5L15.5,12L21,5L19,16H5M19,18A1,1 0 0,1 18,19H6A1,1 0 0,1 5,18V17H19V18Z" />
    </svg>
);

export const ChartIcon: React.FC = () => (
    <svg {...iconProps} className={"w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-6.75 3h9m-9 3h.008v.008H4.5v-.008z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 3.375c-1.105 0-2 .895-2 2v13.25c0 1.105.895 2 2 2h17.25c1.105 0 2-.895 2-2V5.375c0-1.105-.895-2-2-2H3.375z" />
    </svg>
);

export const LinkIcon: React.FC = () => (
    <svg {...iconProps} className={"w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
);

export const AnalyticsIcon: React.FC = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

// New Logger Icons
export const SwordIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M12.83,3.17L15.66,6L13.54,8.12L10.7,5.29L12.83,3.17M9.29,6.7L6.46,3.87L3.63,6.7L6.46,9.53L9.29,6.7M17.07,7.41L14.24,4.58L11.41,7.41L14.24,10.24L17.07,7.41M12,8.12L19,15.07V19H15.07L8.12,12L12,8.12M4,20V15.07L7.41,11.66L12.34,16.59L11.66,17.27L10.24,15.86L9.53,16.57L10.95,18H8.12V20H4Z" />
    </svg>
);

export const CrystalIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M12,2L2,8.5L12,22L22,8.5L12,2M12,4.43L19.07,9.5L12,19.24L4.93,9.5L12,4.43M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11Z" />
    </svg>
);

export const MegaphoneIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M22,6H16.89L13.89,3L12.5,4.39L15.5,7.39H12V9H15.5L12.5,12.61L13.89,14L16.89,11H22V6M2,9H9V12.13C8.33,12.33 7.72,12.69 7.2,13.19L6,12V9H2M4,14V20H6V14C4.81,14 4,14.81 4,16H2C2,13.79 4,12 6,12V11C2.69,11 0,13.69 0,17H2C2,15.9 2.9,15 4,15V14Z" />
    </svg>
);

export const OracleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 12a3.5 3.5 0 00-7 0" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a3.5 3.5 0 000-7" />
    </svg>
);


// Battle Report Icons
export const DamageIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className || "w-5 h-5"}>
        <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.06 3.82-6.34h1l-1 7h3.5c.58 0 .57.32.38.66-.19.34-.05-.06-3.82 6.34Z" />
    </svg>
);

export const HealIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className || "w-5 h-5"}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);

export const SkullIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className || "w-5 h-5"}>
        <path d="M12,2A9,9 0 0,0 3,11V22H21V11A9,9 0 0,0 12,2M8,11A2,2 0 0,1 10,13A2,2 0 0,1 8,15A2,2 0 0,1 6,13A2,2 0 0,1 8,11M16,11A2,2 0 0,1 18,13A2,2 0 0,1 16,15A2,2 0 0,1 14,13A2,2 0 0,1 16,11Z" />
    </svg>
);

export const ClockIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Player Tool Icons
export const RepelIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
    </svg>
);

export const CurrentIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
    </svg>
);

export const GravityIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
    </svg>
);

export const WallIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
);

export const StasisIcon: React.FC<{className?: string}> = ({className}) => (
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);

export const BurdenIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// New Panel Toggle Icons
const panelIconProps = {
    ...iconProps,
    className: "w-6 h-6",
    strokeWidth: 1.5,
};

export const LayoutSidebarLeftCollapse: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>
);
export const LayoutSidebarLeftExpand: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 19.5l-7.5-7.5 7.5-7.5m-6 15l-7.5-7.5 7.5-7.5" /></svg>
);
export const LayoutSidebarRightCollapse: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 4.5l-7.5 7.5 7.5 7.5m6-15l-7.5 7.5 7.5 7.5" /></svg>
);
export const LayoutSidebarRightExpand: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 19.5l7.5-7.5-7.5-7.5m6 15l7.5-7.5-7.5-7.5" /></svg>
);
export const PanelBottomOpen: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5" /></svg>
);
export const PanelBottomClose: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.75l-7.5 7.5-7.5-7.5" /></svg>
);
export const PanelTopOpen: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);
export const PanelTopClose: React.FC = () => (
    <svg {...panelIconProps}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
);

export const MoveIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={className || "w-5 h-5"} viewBox="0 0 20 20" fill="currentColor">
        <circle cx="7" cy="5" r="1.5" />
        <circle cx="13" cy="5" r="1.5" />
        <circle cx="7" cy="10" r="1.5" />
        <circle cx="13" cy="10" r="1.5" />
        <circle cx="7" cy="15" r="1.5" />
        <circle cx="13" cy="15" r="1.5" />
    </svg>
);

export const SettingsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-5 h-5"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.55-.22 1.156-.22 1.706 0 .55.219 1.02.684 1.11 1.226.09.542-.16 1.113-.62 1.448a6.987 6.987 0 01-1.528 3.11 6.987 6.987 0 01-1.528-3.11c-.46-.335-.71-.906-.62-1.448zM12 21a9.002 9.002 0 008.132-5.408 9.002 9.002 0 00-16.264 0A9.002 9.002 0 0012 21z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3.75 3.75 0 110-7.5 3.75 3.75 0 010 7.5z" />
    </svg>
);

export const CrosshairIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3" />
    </svg>
);

export const CameraIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008v-.008z" />
    </svg>
);