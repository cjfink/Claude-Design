/* icons.jsx — compact Lucide-style icon set (1.6px stroke). <Icon name=.. size=.. /> */
(function () {
  const P = {
    cursor: "M4 3l7 17 2.5-6.5L20 11 4 3z",
    hand: "M8 13V5.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-2V6a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1.5a5 5 0 01-3.6-1.5L6 14a1.6 1.6 0 012.3-2.2L10 13.5",
    ruler: "M3 9l6-6 12 12-6 6L3 9zm3 0l1.5 1.5M9 6l1.5 1.5M12 9l1.5 1.5M9 12l1.5 1.5",
    comment: "M21 11.5a8.4 8.4 0 01-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1121 11.5z",
    plus: "M12 5v14M5 12h14",
    layers: "M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    zoomIn: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3M11 8v6M8 11h6",
    zoomOut: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3M8 11h6",
    undo: "M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3",
    redo: "M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3",
    search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3",
    nav: "M3 11l19-8-8 19-2.5-8.5L3 11z",
    bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    droplet: "M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z",
    alert: "M12 3l10 17H2L12 3zm0 6v5m0 3v.5",
    x: "M5 5l14 14M19 5L5 19",
    sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M4 12H1M23 12h-3M5 5L3 3M21 21l-2-2M5 19l-2 2M21 3l-2 2",
    moon: "M21 12.8A8.5 8.5 0 1111.2 3 6.6 6.6 0 0021 12.8z",
    share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13",
    download: "M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3M8 11l4 4 4-4M12 3v12",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeOff: "M3 3l18 18M10.6 10.6A3 3 0 0014 14M9.5 5.4A9.6 9.6 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.7M6.1 6.1A17 17 0 002 12s4 7 10 7a9.5 9.5 0 004-0.9",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    rotate: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
    check: "M5 13l4 4L19 7",
    pin: "M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 4a3 3 0 110 6 3 3 0 010-6z",
    users: "M16 19v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM22 19v-2a4 4 0 00-3-3.8M16 2.2a4 4 0 010 7.6",
    clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2",
    mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3",
    utensils: "M4 3v7a2 2 0 002 2 2 2 0 002-2V3M6 3v18M16 3c-1.5 0-3 2-3 5s1 4 3 4v9",
    door: "M5 21V4a1 1 0 011-1h9a1 1 0 011 1v17M3 21h18M13 12h.5",
    building: "M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M8 8h2M8 12h2M8 16h2M15 21V9h3a1 1 0 011 1v11M3 21h18",
    ticket: "M4 8a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 000-4V8z",
    settings: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.2a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H1a2 2 0 110-4h.2A1.6 1.6 0 003.3 8.4l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V4a2 2 0 114 0v.2a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.2a1.6 1.6 0 00-1.4 1z",
    chevronDown: "M6 9l6 6 6-6",
    chevronRight: "M9 6l6 6-6 6",
    target: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8zM12 11.5a.5.5 0 100 1 .5.5 0 000-1z",
    menu: "M3 6h18M3 12h18M3 18h18",
    star: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.7 6.2 21.3l1.6-6.6L2.6 9.8l6.8-.5L12 3z",
    fit: "M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3",
    flag: "M5 21V4M5 4h11l-2 4 2 4H5",
    compass: "M12 4a8 8 0 100 16 8 8 0 000-16zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  };

  function Icon({ name, size = 18, stroke = 1.6, fill = "none", style, className }) {
    const d = P[name] || P.cursor;
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
        strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style} className={className} aria-hidden="true">
        {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
      </svg>
    );
  }
  window.Icon = Icon;
})();
