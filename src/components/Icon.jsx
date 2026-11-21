const P = {
  battery: <><rect x="2" y="7" width="17" height="10" rx="3" /><path d="M22 10.5v3M6 10.5v3M9.5 10.5v3" /></>,
  env: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4" />,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" /></>,
  send: <path d="M5 12h14M13 6l6 6-6 6" />,
  cart: <><path d="M3 4h2l2.5 11h10.5l2-8H7" /><circle cx="9" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" /></>,
  bus: <><rect x="4" y="4" width="16" height="13" rx="3" /><path d="M4 11h16M8 21v-4M16 21v-4" /></>,
  cup: <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2" />,
  piggy: <><path d="M5 11a7 6 0 0 1 13-2h2v4l-2 1-1 3h-3v-2h-4v2H7l-1-3a5 5 0 0 1-1-3z" /><path d="M15 10h.01" /></>,
  dots: <><circle cx="6" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="18" cy="12" r="1.5" /></>,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v4M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  moon: <path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z" />,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></>,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 18l-6-6 6-6" />,
  right: <path d="M9 6l6 6-6 6" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />,
  timer: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>,
}
export default function Icon({ name, size = 20, className = '', stroke = 2 }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>{P[name]}</svg>
  )
}
