/**
 * Icon set — 24×24 viewBox, 2px round stroke (rendered by <AppIcon>).
 * Add new icons here as inner SVG markup; keep the same grid and stroke style.
 */
export const ICONS = {
  // navigation
  home: '<path d="M3.5 10.5L12 3.5l8.5 7"/><path d="M5.5 9v10.5a1 1 0 001 1H10v-6h4v6h3.5a1 1 0 001-1V9"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  map: '<path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  ar: '<path d="M3 8V5a2 2 0 012-2h3M16 3h3a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/><path d="M12 7.5l4 2.2v4.6l-4 2.2-4-2.2V9.7z"/><path d="M8 9.7l4 2.2 4-2.2M12 11.9v4.6"/>',
  weather: '<path d="M8 3v1.5M3.3 5.3l1 1M2 10h1.5M12.7 5.3l-1 1"/><path d="M5.3 12.5A3.5 3.5 0 0111.2 8"/><path d="M17 20H8.5a4 4 0 11.7-7.9A5 5 0 0117 13.5a3.25 3.25 0 010 6.5z"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  navigate: '<path d="M12 2l7.5 19-7.5-4.5L4.5 21z"/>',
  turnLeft: '<path d="M9 5L4 10l5 5"/><path d="M4 10h9a6 6 0 016 6v4"/>',
  turnRight: '<path d="M15 5l5 5-5 5"/><path d="M20 10h-9a6 6 0 00-6 6v4"/>',
  up: '<path d="M12 20V5M5 12l7-7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  locate: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7.5"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  // content & facts
  heart: '<path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.4 3.8 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.2 0 5.3 2.9 4.2 6.2C19.5 15.4 12 20 12 20z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6-2.5-2.5 1-5 3.5 3 3 1.5M7 11l2.5-3.5M12 15l2.5 6"/>',
  accessible: '<circle cx="11" cy="4.5" r="1.8"/><path d="M11 8v6h6l2 5"/><path d="M8 11.5a5 5 0 107.6 6.3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 014.8 1c0 1.7-2.3 2-2.3 3.5M12 17v.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
  shoe: '<path d="M3 17h18v-2c0-1.5-1-2.3-2.5-2.6L13 11l-2-4H6L3 10z"/><path d="M3 20h18"/>',
  // media
  play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  rewind: '<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/>',
  forward: '<path d="M21 12a9 9 0 11-9-9 9.7 9.7 0 016.7 2.8L21 8"/><path d="M21 3v5h-5"/>',
  headphones: '<path d="M4 17v-5a8 8 0 0116 0v5"/><rect x="3" y="15" width="4" height="6" rx="1.5"/><rect x="17" y="15" width="4" height="6" rx="1.5"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 5M22 9l-5 5"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  wifi: '<path d="M2 8.5a15 15 0 0120 0M5 12a10 10 0 0114 0M8.5 15.5a5 5 0 017 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  // places & waypoints
  house: '<path d="M3 9.5L12 4l9 5.5"/><path d="M5.5 10v9M10 10v9M14 10v9M18.5 10v9M3 21h18"/>',
  church: '<path d="M12 2v4M10 4h4"/><path d="M6 21V11l6-5 6 5v10"/><path d="M10 21v-4a2 2 0 014 0v4M3 21h18"/>',
  anchor: '<circle cx="12" cy="5" r="2"/><path d="M12 7v14M5 13a7 7 0 0014 0M8.5 10.5h7"/>',
  toilet: '<circle cx="7.5" cy="4.5" r="1.6"/><path d="M6 21v-6H4.8l1-7h3.4l1 7H9v6"/><circle cx="16.5" cy="4.5" r="1.6"/><path d="M14.5 21V8h4v13"/>',
  coffee: '<path d="M4 8h13v5a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 010 5H17M8 2.5v3M12 2.5v3M3 21.5h16"/>',
  book: '<path d="M4 4.5h6a2 2 0 012 2V20a2 2 0 00-2-2H4zM20 4.5h-6a2 2 0 00-2 2V20a2 2 0 012-2h6z"/>',
  // weather
  wind: '<path d="M3 8h11a3 3 0 10-3-3M3 12h16a3 3 0 11-3 3M3 16h8"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
}
