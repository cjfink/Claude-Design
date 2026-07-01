/* =====================================================================
   The Charlotte Coffee Festival — FESTIVAL STUDIO
   data.js — venue model (feet), layers, power/water/emergency
   infrastructure, vendor categories, and a multi-layout localStorage
   store. All coordinates are in feet; the canvas converts to px.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Vendor categories ----------------------------------- */
  const CATEGORIES = {
    Roaster:     { color: "#6E4630", label: "Roaster" },
    Bakery:      { color: "#C29A6B", label: "Bakery" },
    "Coffee Shop": { color: "#9C8B6E", label: "Coffee Shop" },
    "Tea & Chai": { color: "#6B6E45", label: "Tea & Chai" },
    Other:       { color: "#8F7B86", label: "Other" },
    Sponsor:     { color: "#AA7050", label: "Sponsor" },
  };
  const CAT_KEYS = Object.keys(CATEGORIES);
  const POWER_BY_CAT = { Roaster: 3, Bakery: 4, "Coffee Shop": 2, "Tea & Chai": 2, Other: 2, Sponsor: 6 };

  /* ---------- Layers ---------------------------------------------- */
  const LAYERS = [
    { key: "booths", label: "Vendor booths", color: "#6E4630", locked: false },
    { key: "places", label: "Stages & structures", color: "#3A2C18", locked: false },
    { key: "power", label: "Power & generators", color: "#C9A227", locked: false },
    { key: "water", label: "Water access", color: "#5C8AA6", locked: false },
    { key: "emergency", label: "Emergency lanes", color: "#C24A3A", locked: false },
    { key: "labels", label: "Booth labels", color: "#746137", locked: false },
    { key: "grid", label: "Grid & rulers", color: "#746137", locked: false },
  ];
  const DEFAULT_LAYERS = { booths: true, places: true, power: false, water: false, emergency: false, labels: true, grid: true };

  /* ---------- Venue layout (feet) — portrait, mirrors the real lot - */
  const LOT = { w: 286, h: 396 };

  // Official 2026 lineup → [name, category]
  const ROSTER = [
    ["Aara Coffee Company", "Roaster"],
    ["Alexis' Cookie Co.", "Bakery"],
    ["Arboquin Coffee", "Roaster"],
    ["Atlas Brews", "Coffee Shop"],
    ["Bean & Bun", "Coffee Shop"],
    ["Bean Lab", "Coffee Shop"],
    ["Beyond Amazing Donuts", "Bakery"],
    ["Biscuits N Thangs", "Bakery"],
    ["Black Cat Coffee Co.", "Coffee Shop"],
    ["Breezeway Coffee Roasters", "Roaster"],
    ["Buen Dia Cafe", "Roaster"],
    ["Bush Hill Coffee Co.", "Roaster"],
    ["Charleston Coffee Roasters", "Roaster"],
    ["Coco and the Director", "Coffee Shop"],
    ["Companion Coffee Roasters", "Roaster"],
    ["COOL IDIOT COFFEE", "Coffee Shop"],
    ["Defined Coffee", "Roaster"],
    ["DONA", "Tea & Chai"],
    ["Dulce Dreams", "Bakery"],
    ["Firm Foundation Coffee", "Coffee Shop"],
    ["HAERFEST COFFEE roasting co.", "Roaster"],
    ["Hickory Grove Coffee", "Roaster"],
    ["High Octane", "Coffee Shop"],
    ["Immigrant Culture", "Roaster"],
    ["Indigo Tea + Coffee", "Coffee Shop"],
    ["It's Flowering", "Other"],
    ["Javesca", "Roaster"],
    ["Kaldi's Coffeehouse & Roastery", "Roaster"],
    ["Knowledge Perk Coffee Co.", "Roaster"],
    ["Kofi Kofi Co.", "Roaster"],
    ["La Loma Coffee", "Roaster"],
    ["Magnolia Coffee", "Roaster"],
    ["Mama Moon Sourdough", "Bakery"],
    ["Mauve Lynn Bakehouse", "Bakery"],
    ["Moonbean Roastery", "Roaster"],
    ["Mug & Maple", "Coffee Shop"],
    ["Pancake Daddy's", "Bakery"],
    ["Robusta Coffee", "Coffee Shop"],
    ["Roost Roastery", "Roaster"],
    ["San Café", "Roaster"],
    ["Sharewell Coffee Company", "Roaster"],
    ["Shore Coffee Roasters", "Roaster"],
    ["Sweet Spoon Bakery", "Bakery"],
    ["Sweetwaters Coffee & Tea", "Coffee Shop"],
    ["The Chai Box", "Tea & Chai"],
    ["Three Oaks", "Roaster"],
    ["Tiny Tulip Coffee", "Coffee Shop"],
    ["Trailhead Oven", "Bakery"],
    ["Two Cups Coffee + Matcha", "Coffee Shop"],
    ["VAROSH Coffee Roasters", "Roaster"],
    ["Zikr Coffee", "Coffee Shop"],
  ];

  // Lay out a block of booths in rows. Returns booth objects.
  function block(x0, y0, cols, rows, names, pitchX, pitchY, size, startId) {
    const out = [];
    let i = 0, id = startId;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (i >= names.length) break;
        const [label, category] = names[i++];
        out.push({
          id: id++, kind: "booth", label, category, status: "confirmed",
          powerKW: POWER_BY_CAT[category] || 2, water: category === "Bakery",
          x: x0 + c * pitchX, y: y0 + r * pitchY, w: size, h: size, rot: 0,
        });
      }
    }
    return out;
  }

  function buildDoc(name, scatter) {
    let id = 1;
    // Vendors mirror the real venue: a row along the TOP edge, a column
    // down the LEFT edge, and central rows beside the taproom building.
    const topRow  = block(40, 8, 11, 1, ROSTER.slice(0, 11), 15, 14, 10, id); id += topRow.length;    // 11
    const leftCol = block(4, 34, 1, 12, ROSTER.slice(11, 23), 14, 14, 10, id); id += leftCol.length;  // 12
    const central = block(80, 62, 3, 10, ROSTER.slice(23, 51), 15, 14, 10, id); id += central.length; // 28
    let booths = topRow.concat(leftCol, central);

    // Optional draft variant: mark a few unconfirmed
    if (scatter) booths = booths.map((b, k) => (k % 6 === 0 ? { ...b, status: "pending" } : (k % 11 === 0 ? { ...b, status: "unassigned" } : b)));

    const sponsors = [
      { id: id++, kind: "booth", label: "Night Swim", category: "Sponsor", status: "confirmed", powerKW: 8, sponsorTier: "Title", water: true, x: 78, y: 212, w: 30, h: 24, rot: 0 },
      { id: id++, kind: "booth", label: "Maizly", category: "Sponsor", status: "confirmed", powerKW: 6, sponsorTier: "Gold", water: false, x: 116, y: 214, w: 26, h: 20, rot: 0 },
    ];

    const places = [
      { id: id++, kind: "building", label: "Lenny Boy Taproom", x: 160, y: 70, w: 104, h: 212, rot: 0 },
      { id: id++, kind: "restroom", label: "Restrooms", x: 210, y: 8, w: 46, h: 24, rot: 0 },
      { id: id++, kind: "stage", label: "Main Stage", x: 4, y: 214, w: 46, h: 72, rot: 0 },
      { id: id++, kind: "food", label: "Food Court", x: 160, y: 300, w: 96, h: 50, rot: 0 },
      { id: id++, kind: "ticketing", label: "Ticketing", x: 78, y: 318, w: 58, h: 30, rot: 0 },
      { id: id++, kind: "entrance", label: "Main Entrance", x: 100, y: 384, w: 64, h: 10, rot: 0 },
      { id: id++, kind: "entrance", label: "Vendor Load-In", x: 274, y: 40, w: 12, h: 46, rot: 0 },
    ];

    // Power infrastructure
    const power = [
      { id: id++, kind: "generator", label: "Gen A · 60kW", x: 258, y: 4, w: 22, h: 12, kW: 60 },
      { id: id++, kind: "generator", label: "Gen B · 60kW", x: 4, y: 300, w: 22, h: 12, kW: 60 },
      { id: id++, kind: "generator", label: "Gen C · 45kW", x: 256, y: 366, w: 22, h: 12, kW: 45 },
    ];
    // Power drops near the vendor rows
    const drops = [];
    [86, 116, 146].forEach((x) => { [60, 110, 160].forEach((y) => drops.push({ id: id++, kind: "power", x, y, amps: 50 })); });
    [62, 122, 182].forEach((y) => drops.push({ id: id++, kind: "power", x: 26, y, amps: 50 }));
    drops.push({ id: id++, kind: "power", x: 120, y: 24, amps: 50 });
    drops.push({ id: id++, kind: "power", x: 168, y: 24, amps: 100 });

    // Water spigots
    const water = [
      { id: id++, kind: "water", x: 60, y: 210, gpm: 8 },
      { id: id++, kind: "water", x: 150, y: 300, gpm: 8 },
      { id: id++, kind: "water", x: 24, y: 200, gpm: 5 },
    ];

    // Emergency lane — a 16ft clear lane down the central aisle to the exit
    const emergency = {
      width: 16,
      path: [{ x: 150, y: 24 }, { x: 150, y: 360 }, { x: 132, y: 360 }, { x: 132, y: 384 }],
    };

    return {
      name,
      lot: { ...LOT },
      objects: booths.concat(sponsors, places, power, drops, water),
      emergency,
      comments: [],
      measurements: [],
      published: !scatter,
    };
  }

  /* ---------- Multi-layout store (localStorage) ------------------- */
  const KEY = "tccf_studio_v5";
  const listeners = new Set();

  function freshState() {
    return {
      layouts: [buildDoc("Main Layout — Published", false), buildDoc("Saturday Draft", true)],
      activeIndex: 0,
    };
  }

  function load() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!s || !s.layouts || !s.layouts.length) { s = freshState(); persist(s); }
    return s;
  }
  function persist(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { console.warn("persist", e); } }
  function save(s) { persist(s); listeners.forEach((fn) => { try { fn(s); } catch (e) {} }); }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function reset() { const s = freshState(); save(s); return s; }
  window.addEventListener("storage", (e) => { if (e.key === KEY) { const s = load(); listeners.forEach((fn) => fn(s)); } });

  /* ---------- Helpers --------------------------------------------- */
  const STATUS = {
    confirmed: { label: "Confirmed", color: "#5d6b3c", soft: "#dfe2c8" },
    pending:   { label: "Pending",   color: "#b07d2e", soft: "#f1e0cb" },
    unassigned:{ label: "Open",      color: "#9a9483", soft: "#e6e1d6" },
  };

  function colorFor(o) {
    if (o.kind === "booth") return (CATEGORIES[o.category] || CATEGORIES["Coffee Shop"]).color;
    return null;
  }

  /* ---------- Add-to-map presets (organizer) ---------------------- */
  // group: "booth" | "structure" | "infra" ; pt = point marker (no w/h)
  const PRESETS = {
    vendor:    { group: "booth",     icon: "flag",     name: "Vendor booth", layer: "booths", make: { kind: "booth", label: "New Vendor", category: "Coffee Shop", status: "unassigned", powerKW: 2, water: false, w: 10, h: 10, rot: 0 } },
    sponsor:   { group: "booth",     icon: "star",     name: "Sponsor",      layer: "booths", make: { kind: "booth", label: "New Sponsor", category: "Sponsor", status: "unassigned", powerKW: 6, water: false, w: 20, h: 18, rot: 0 } },
    stage:     { group: "structure", icon: "mic",      name: "Stage",        layer: "places", make: { kind: "stage", label: "Stage", w: 40, h: 30, rot: 0 } },
    food:      { group: "structure", icon: "utensils", name: "Food court",   layer: "places", make: { kind: "food", label: "Food Court", w: 60, h: 40, rot: 0 } },
    ticketing: { group: "structure", icon: "ticket",   name: "Ticketing",    layer: "places", make: { kind: "ticketing", label: "Ticketing", w: 50, h: 26, rot: 0 } },
    restroom:  { group: "structure", icon: "droplet",  name: "Restrooms",    layer: "places", make: { kind: "restroom", label: "Restrooms", w: 38, h: 22, rot: 0 } },
    building:  { group: "structure", icon: "building", name: "Building",     layer: "places", make: { kind: "building", label: "Building", w: 40, h: 40, rot: 0 } },
    entrance:  { group: "structure", icon: "door",     name: "Entrance",     layer: "places", make: { kind: "entrance", label: "Entrance", w: 40, h: 12, rot: 0 } },
    patch:     { group: "structure", icon: "target",   name: "Patch",        layer: "places", make: { kind: "patch", label: "Patch", w: 30, h: 30, rot: 0 } },
    generator: { group: "infra",     icon: "bolt",     name: "Generator",    layer: "power",  make: { kind: "generator", label: "Generator · 45kW", kW: 45, w: 18, h: 12, rot: 0 } },
    power:     { group: "infra",     icon: "bolt",     name: "Power drop",   layer: "power",  pt: true, make: { kind: "power", amps: 50, size: 4.5 } },
    water:     { group: "infra",     icon: "droplet",  name: "Water tap",    layer: "water",  pt: true, make: { kind: "water", gpm: 8, size: 4.5 } },
  };

  window.STUDIO = {
    CATEGORIES, CAT_KEYS, LAYERS, DEFAULT_LAYERS, STATUS, LOT,
    colorFor, buildDoc, PRESETS,
    store: { load, save, subscribe, reset },
    EVENT: { name: "The Charlotte Coffee Festival", date: "SAT · SEP 12, 2026", venue: "Lenny Boy Brewing Co · Charlotte NC" },
    TEAM: [
      { name: "Maya R.", initials: "MR", color: "#AA7050" },
      { name: "Devon K.", initials: "DK", color: "#6B6E45" },
      { name: "Priya S.", initials: "PS", color: "#5C8AA6" },
    ],
  };
})();
