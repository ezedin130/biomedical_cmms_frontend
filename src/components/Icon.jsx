const PATHS = {
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  clip: 'M9 4h6v3H9zM8 5H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1h-2M9 12h6M9 16h4',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9',
  users: 'M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 20c0-3 2.7-5 6-5s6 2 6 5M16 4.7a3.5 3.5 0 010 6.6M17.5 15.3c2.3.6 3.5 2.2 3.5 4.7',
  pack: 'M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8M8 6l8 4',
  cal: 'M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zM4 10h16M8 3v4M16 3v4',
  plus: 'M12 5v14M5 12h14',
  moon: 'M20 15a8 8 0 01-11-11 8 8 0 1011 11z',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  out: 'M14 8V6a1 1 0 00-1-1H6a1 1 0 00-1 1v12a1 1 0 001 1h7a1 1 0 001-1v-2M10 12h11M18 9l3 3-3 3',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  wrench: 'M14.7 6.3a4 4 0 015.3 5L11.5 19.5a2.1 2.1 0 01-3-3L17 8',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  check: 'M5 13l4 4L19 7',
  chev: 'M6 9l6 6 6-6',
  back: 'M15 18l-6-6 6-6',
  lock: 'M7 11h10a1 1 0 011 1v7a1 1 0 01-1 1H7a1 1 0 01-1-1v-7a1 1 0 011-1zM8 11V8a4 4 0 018 0v3',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
};

export default function Icon({ name, className = 'ico' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] || PATHS.grid} />
    </svg>
  );
}
