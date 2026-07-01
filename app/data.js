/* =====================================================================
   The Charlotte Coffee Festival — Vendor Map
   data.js — seed layout, vendor categorization, and the localStorage
   store (replaces the original Supabase backend with offline-first
   persistence + live cross-tab sync).
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Lot + seed objects (feet) ----------------------------- */
  // Lot is measured in feet; `scale` is px-per-foot at 100% zoom.
  const SEED = {
    lot: { w: 286, h: 396, scale: 4.5 },
    objects: [
      { id: 1, category: "building", type: "building", label: "Lenny Boy", x: 165, y: 110, w: 119, h: 259, bg: "#CFC9BC", border: "#9a9483", text_color: "#4A4B35" },
      { id: 3, category: "tent", type: "vendor", label: "Aara Coffee Co.", x: 40, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 4, category: "tent", type: "vendor", label: "Alexis' Cookie Co.", x: 130, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 5, category: "tent", type: "vendor", label: "Arboquin Coffee", x: 145, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 6, category: "tent", type: "vendor", label: "Atlas Brews", x: 55, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 7, category: "tent", type: "vendor", label: "Bean Lab", x: 70, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 8, category: "tent", type: "vendor", label: "Beyond Amazing Donuts", x: 85, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 9, category: "tent", type: "vendor", label: "Biscuits & Thangs", x: 100, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 10, category: "tent", type: "vendor", label: "Black Cat", x: 160, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 11, category: "tent", type: "vendor", label: "Breezeway Coffee", x: 115, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 12, category: "tent", type: "vendor", label: "Buen Dia Cafe", x: 175, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 13, category: "misc", type: "entrance", label: "Front Entrance", x: 80, y: 385, w: 50, h: 10, bg: "#6B6E45", border: "#4A4B35", text_color: "#F7F6F2" },
      { id: 14, category: "misc", type: "entrance", label: "Back Entrance", x: 275, y: 30, w: 10, h: 50, bg: "#6B6E45", border: "#4A4B35", text_color: "#F7F6F2" },
      { id: 15, category: "tent", type: "vendor", label: "Bush Hill Coffee", x: 185, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 16, category: "tent", type: "vendor", label: "Charleston Coffee", x: 110, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 17, category: "tent", type: "vendor", label: "Coco & the Director", x: 125, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 18, category: "tent", type: "vendor", label: "Companion Coffee", x: 190, y: 5, w: 10, h: 10, status: "confirmed" },
      { id: 19, category: "tent", type: "vendor", label: "Cool Idiot Coffee", x: 170, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 20, category: "tent", type: "vendor", label: "Defined Coffee", x: 155, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 21, category: "tent", type: "vendor", label: "DONA", x: 140, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 22, category: "tent", type: "vendor", label: "Dulce Dreams", x: 170, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 23, category: "tent", type: "vendor", label: "Firm Foundation", x: 155, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 24, category: "tent", type: "vendor", label: "Hærfest Coffee", x: 140, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 25, category: "tent", type: "vendor", label: "Hickory Grove Coffee", x: 125, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 26, category: "tent", type: "vendor", label: "High Octane", x: 110, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 27, category: "tent", type: "vendor", label: "Immigrant Culture", x: 185, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 28, category: "tent", type: "vendor", label: "Indigo Tea + Coffee", x: 0, y: 110, w: 10, h: 10, status: "confirmed" },
      { id: 29, category: "tent", type: "vendor", label: "It's Flowering", x: 0, y: 125, w: 10, h: 10, status: "pending" },
      { id: 30, category: "tent", type: "vendor", label: "Javesca", x: 0, y: 80, w: 10, h: 10, status: "confirmed" },
      { id: 31, category: "tent", type: "vendor", label: "Kaldi's Coffeehouse", x: 0, y: 95, w: 10, h: 10, status: "confirmed" },
      { id: 32, category: "tent", type: "vendor", label: "Knowledge Perk Coffee", x: 0, y: 140, w: 10, h: 10, status: "confirmed" },
      { id: 33, category: "tent", type: "vendor", label: "Kofi Kofi Co.", x: 0, y: 155, w: 10, h: 10, status: "confirmed" },
      { id: 34, category: "misc", type: "stage", label: "Stage", x: 0, y: 185, w: 33, h: 66, bg: "#3A2C18", border: "#6a4a28", text_color: "#EBE5DB" },
      { id: 35, category: "tent", type: "vendor", label: "La Loma Coffee", x: 0, y: 35, w: 10, h: 10, status: "confirmed" },
      { id: 36, category: "tent", type: "vendor", label: "Magnolia Coffee", x: 0, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 37, category: "tent", type: "vendor", label: "Mama Moon Sourdough", x: 0, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 38, category: "tent", type: "vendor", label: "Mauve Lynn Bakehouse", x: 0, y: 20, w: 10, h: 10, status: "confirmed" },
      { id: 39, category: "tent", type: "vendor", label: "Moonbeam Roastery", x: 95, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 40, category: "tent", type: "vendor", label: "Pancake Daddy's", x: 95, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 41, category: "tent", type: "vendor", label: "Robusta Coffee", x: 80, y: 65, w: 10, h: 10, status: "confirmed" },
      { id: 43, category: "tent", type: "vendor", label: "Roost Roastery", x: 80, y: 50, w: 10, h: 10, status: "confirmed" },
      { id: 44, category: "tent", type: "vendor", label: "San Café", x: 80, y: 145, w: 10, h: 10, status: "confirmed" },
      { id: 45, category: "tent", type: "vendor", label: "Sweet Spoon Bakery", x: 80, y: 130, w: 10, h: 10, status: "confirmed" },
      { id: 46, category: "tent", type: "vendor", label: "The Chai Box", x: 95, y: 80, w: 10, h: 10, status: "confirmed" },
      { id: 47, category: "tent", type: "vendor", label: "Three Oaks", x: 95, y: 130, w: 10, h: 10, status: "confirmed" },
      { id: 48, category: "tent", type: "vendor", label: "Tiny Tulip Coffee", x: 95, y: 115, w: 10, h: 10, status: "confirmed" },
      { id: 49, category: "tent", type: "vendor", label: "Trailhead Oven", x: 80, y: 115, w: 10, h: 10, status: "confirmed" },
      { id: 50, category: "tent", type: "vendor", label: "Two Cups Coffee", x: 80, y: 160, w: 10, h: 10, status: "confirmed" },
      { id: 51, category: "tent", type: "vendor", label: "Varosh", x: 95, y: 145, w: 10, h: 10, status: "confirmed" },
      { id: 52, category: "tent", type: "vendor", label: "Zikr Coffee", x: 95, y: 160, w: 10, h: 10, status: "confirmed" },
      { id: 53, category: "tent", type: "vendor", label: "Open Booth", x: 80, y: 175, w: 10, h: 10, status: "unassigned" },
      { id: 54, category: "tent", type: "vendor", label: "Open Booth", x: 95, y: 175, w: 10, h: 10, status: "unassigned" },
      { id: 55, category: "tent", type: "vendor", label: "Open Booth", x: 80, y: 190, w: 10, h: 10, status: "unassigned" },
      { id: 56, category: "tent", type: "vendor", label: "Open Booth", x: 95, y: 190, w: 10, h: 10, status: "unassigned" },
      { id: 57, category: "tent", type: "vendor", label: "Open Booth", x: 95, y: 100, w: 10, h: 10, status: "unassigned" },
      { id: 58, category: "tent", type: "vendor", label: "Open Booth", x: 80, y: 100, w: 10, h: 10, status: "unassigned" },
      { id: 59, category: "misc", type: "restroom", label: "Restrooms", x: 225, y: 5, w: 10, h: 10, bg: "#75878B", border: "#4f6064", text_color: "#F7F6F2" },
      { id: 60, category: "misc", type: "restroom", label: "Restrooms", x: 240, y: 5, w: 10, h: 10, bg: "#75878B", border: "#4f6064", text_color: "#F7F6F2" },
      { id: 61, category: "misc", type: "restroom", label: "Restrooms", x: 255, y: 5, w: 10, h: 10, bg: "#75878B", border: "#4f6064", text_color: "#F7F6F2" },
      { id: 62, category: "misc", type: "restroom", label: "Restrooms", x: 270, y: 5, w: 10, h: 10, bg: "#75878B", border: "#4f6064", text_color: "#F7F6F2" },
      { id: 64, category: "tent", type: "vendor", label: "TCCF Tent", x: 150, y: 290, w: 10, h: 20, status: "confirmed" },
      { id: 65, category: "zone", type: "zone", label: "Ticketing", x: 80, y: 330, w: 50, h: 30, bg: "rgba(170,112,80,0.16)", border: "#AA7050", text_color: "#4A4B35" },
      { id: 66, category: "tent", type: "food", label: "Food & Drink", x: 150, y: 255, w: 10, h: 10, status: "confirmed" },
      { id: 67, category: "tent", type: "food", label: "Food & Drink", x: 150, y: 235, w: 10, h: 10, status: "confirmed" },
      { id: 68, category: "tent", type: "food", label: "Food & Drink", x: 150, y: 215, w: 10, h: 10, status: "confirmed" },
    ],
  };

  /* ---------- Vendor sub-categories --------------------------------- */
  const VENDOR_CATEGORIES = ["Roaster", "Bakery", "Coffee Shop", "Tea & Chai", "Sponsor", "Other"];

  // Earthy palette pulled into the TCCF system: warm browns + one cool blue.
  const CATEGORY_COLORS = {
    "Roaster":     "#6E4630", // roasted sienna
    "Bakery":      "#C29A6B", // golden crust
    "Coffee Shop": "#9C8B6E", // latte tan
    "Tea & Chai":  "#6B6E45", // sage / forest
    "Sponsor":     "#AA7050", // coral
    "Other":       "#75878B", // dusty blue
  };

  const CATEGORY_MAP = {
    Roaster: ["Aara", "Arboquin", "Breezeway", "Buen Dia", "Bush Hill", "Charleston",
      "Companion", "Defined", "Hærfest", "Haerfest", "Hickory Grove", "Immigrant Culture",
      "Javesca", "Kaldi", "Knowledge Perk", "Kofi Kofi", "La Loma", "Magnolia", "Moonbeam",
      "Roost", "San Café", "San Cafe", "Sharewell", "Three Oaks", "Varosh"],
    Bakery: ["Alexis", "Beyond Amazing", "Biscuits", "Dulce Dreams", "Mama Moon",
      "Mauve Lynn", "Pancake Daddy", "Sweet Spoon", "Trailhead Oven"],
    "Coffee Shop": ["Atlas", "Bean Lab", "Black Cat", "Coco", "Cool Idiot",
      "Firm Foundation", "High Octane", "Indigo", "Robusta", "Tiny Tulip", "Two Cups", "Zikr"],
    "Tea & Chai": ["DONA", "Chai Box"],
    Sponsor: ["Night Swim", "Maizly", "Sponsor"],
    Other: ["Flowering"],
  };

  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9æ ]+/gi, "").trim();

  function categorizeVendor(label) {
    if (!label) return null;
    const n = norm(label);
    for (const cat of VENDOR_CATEGORIES) {
      if ((CATEGORY_MAP[cat] || []).some((needle) => n.includes(norm(needle)))) return cat;
    }
    return null;
  }

  /* ---------- Tent default fill (when no logo / category) ----------- */
  const TENT_DEFAULT = { bg: "#9C8B6E", border: "#7c6d52", text_color: "#3A2C18" };

  function fillFor(o) {
    if (o.bg) return { bg: o.bg, border: o.border, text_color: o.text_color };
    if (o.type === "sponsor") return { bg: CATEGORY_COLORS.Sponsor, border: "#80502f", text_color: "#F7F6F2" };
    if (o.type === "food") return { bg: "#4A4B35", border: "#33341f", text_color: "#EBE5DB" };
    const cat = categorizeVendor(o.label);
    if (cat) return { bg: CATEGORY_COLORS[cat], border: "rgba(24,24,24,0.35)", text_color: "#F7F6F2" };
    return TENT_DEFAULT;
  }

  /* ---------- Store (localStorage + cross-tab sync) ----------------- */
  const KEY_OBJ = "tccf_map_objects_v1";
  const KEY_LOT = "tccf_map_lot_v1";
  const listeners = new Set();

  function load() {
    let objects, lot;
    try { objects = JSON.parse(localStorage.getItem(KEY_OBJ)); } catch (e) { objects = null; }
    try { lot = JSON.parse(localStorage.getItem(KEY_LOT)); } catch (e) { lot = null; }
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      objects = SEED.objects.map((o) => ({ ...o }));
      lot = { ...SEED.lot };
      persist(objects, lot);
    }
    if (!lot) lot = { ...SEED.lot };
    return { objects, lot };
  }

  function persist(objects, lot) {
    try {
      localStorage.setItem(KEY_OBJ, JSON.stringify(objects));
      if (lot) localStorage.setItem(KEY_LOT, JSON.stringify(lot));
    } catch (e) { console.warn("Persist failed (quota?)", e); }
  }

  function save(objects, lot) {
    persist(objects, lot);
    listeners.forEach((fn) => { try { fn({ objects, lot }); } catch (e) {} });
  }

  function resetToSeed() {
    const objects = SEED.objects.map((o) => ({ ...o }));
    const lot = { ...SEED.lot };
    save(objects, lot);
    return { objects, lot };
  }

  // Cross-tab: when another tab writes, notify listeners in this tab.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY_OBJ && e.key !== KEY_LOT) return;
    const data = load();
    listeners.forEach((fn) => { try { fn(data); } catch (err) {} });
  });

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  window.TCCF = {
    SEED, VENDOR_CATEGORIES, CATEGORY_COLORS, categorizeVendor, fillFor,
    store: { load, save, subscribe, resetToSeed },
    ORG_PIN: "clt2026",
    EVENT: { name: "The Charlotte Coffee Festival", short: "Vendor Map · Vol. 02",
      date: "SAT · SEP 12, 2026", venue: "Lenny Boy Brewing Co · Charlotte NC",
      tickets: "https://www.cltcoffeefestival.com/tickets" },
  };
})();
