/* useStudio.jsx — multi-layout state, undo/redo, object CRUD,
   comments, measurements, layout versioning. window.useStudio */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const store = window.STUDIO.store;
  const HIST = 60;

  function useStudio() {
    const [state, setState] = useState(() => store.load());
    const stateRef = useRef(state);
    stateRef.current = state; // always points at the latest state (fixes stale-closure during drags)
    const past = useRef([]); const future = useRef([]);
    const [, force] = useState(0);
    const localWrite = useRef(false);

    useEffect(() => store.subscribe((s) => { if (localWrite.current) return; stateRef.current = s; setState(s); }), []);

    const active = state.layouts[state.activeIndex];

    // Core: apply a producer to current state. recordHistory pushes one undo snapshot.
    const apply = useCallback((producer, recordHistory) => {
      const prev = stateRef.current;
      if (recordHistory) { past.current.push(JSON.stringify(prev)); if (past.current.length > HIST) past.current.shift(); future.current = []; }
      const next = producer(prev);
      stateRef.current = next;
      localWrite.current = true;
      setState(next);
      store.save(next);
      setTimeout(() => { localWrite.current = false; }, 0);
      force((n) => n + 1);
    }, []);

    const write = useCallback((nextState, pushHistory) => { apply(() => nextState, pushHistory !== false); }, [apply]);

    // Push a single undo snapshot WITHOUT changing state — call once at the start
    // of a continuous interaction (e.g. a drag) so the whole drag is one undo step.
    const beginChange = useCallback(() => {
      past.current.push(JSON.stringify(stateRef.current));
      if (past.current.length > HIST) past.current.shift();
      future.current = [];
      force((n) => n + 1);
    }, []);

    // mutate the active layout. recordHistory defaults true; pass {transient:true} to skip.
    const mutateActive = useCallback((fn, recordHistory) => {
      apply((prev) => ({ ...prev, layouts: prev.layouts.map((l, i) => (i === prev.activeIndex ? fn({ ...l }) : l)) }), recordHistory !== false);
    }, [apply]);

    const updateObjects = useCallback((patches, opts) => {
      const transient = opts === false || (opts && opts.transient);
      mutateActive((l) => {
        const map = Object.fromEntries(patches.map((p) => [p.id, p]));
        l.objects = l.objects.map((o) => (map[o.id] ? { ...o, ...map[o.id] } : o));
        return l;
      }, !transient);
    }, [mutateActive]);

    const addObject = useCallback((obj) => {
      let id;
      mutateActive((l) => { id = (l.objects.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1; l.objects = [...l.objects, { ...obj, id }]; return l; });
      return id;
    }, [mutateActive]);

    const deleteObjects = useCallback((ids) => {
      const set = new Set(ids);
      mutateActive((l) => { l.objects = l.objects.filter((o) => !set.has(o.id)); return l; });
    }, [mutateActive]);

    const duplicateObjects = useCallback((ids) => {
      const newIds = [];
      mutateActive((l) => {
        let maxId = l.objects.reduce((m, o) => Math.max(m, o.id), 0);
        const set = new Set(ids);
        const dupes = l.objects.filter((o) => set.has(o.id)).map((o) => { maxId += 1; newIds.push(maxId); return { ...o, id: maxId, x: o.x + 6, y: o.y + 6, label: o.label }; });
        l.objects = [...l.objects, ...dupes];
        return l;
      });
      return newIds;
    }, [mutateActive]);

    const addComment = useCallback((c) => { mutateActive((l) => { const id = Date.now(); l.comments = [...(l.comments||[]), { id, ...c }]; return l; }); }, [mutateActive]);
    const resolveComment = useCallback((id) => { mutateActive((l) => { l.comments = (l.comments||[]).filter((c) => c.id !== id); return l; }); }, [mutateActive]);
    const addMeasurement = useCallback((m) => { mutateActive((l) => { l.measurements = [...(l.measurements||[]), m]; return l; }); }, [mutateActive]);
    const setEmergency = useCallback((em, opts) => { const transient = opts && opts.transient; mutateActive((l) => { l.emergency = em; return l; }, !transient); }, [mutateActive]);
    const deleteMeasurement = useCallback((idx) => { mutateActive((l) => { l.measurements = (l.measurements||[]).filter((_, i) => i !== idx); return l; }); }, [mutateActive]);
    const clearMeasurements = useCallback(() => { mutateActive((l) => { l.measurements = []; return l; }); }, [mutateActive]);

    // whole-project backup
    const importState = useCallback((s) => {
      if (!s || !Array.isArray(s.layouts) || !s.layouts.length) throw new Error("Invalid backup file");
      const clean = { layouts: s.layouts, activeIndex: Math.max(0, Math.min(s.layouts.length - 1, s.activeIndex || 0)) };
      write(clean);
    }, [write]);

    const undo = useCallback(() => { const prev = past.current.pop(); if (!prev) return; future.current.push(JSON.stringify(stateRef.current)); const s = JSON.parse(prev); stateRef.current = s; localWrite.current = true; setState(s); store.save(s); setTimeout(()=>{localWrite.current=false;},0); force((n)=>n+1); }, []);
    const redo = useCallback(() => { const nxt = future.current.pop(); if (!nxt) return; past.current.push(JSON.stringify(stateRef.current)); const s = JSON.parse(nxt); stateRef.current = s; localWrite.current = true; setState(s); store.save(s); setTimeout(()=>{localWrite.current=false;},0); force((n)=>n+1); }, []);

    // layout management
    const setActiveIndex = useCallback((i) => { write({ ...state, activeIndex: i }, false); }, [state, write]);
    const duplicateLayout = useCallback(() => {
      const copy = JSON.parse(JSON.stringify(active)); copy.name = active.name.replace(/ \(copy\)$/,"") + " (copy)"; copy.published = false;
      const layouts = [...state.layouts, copy];
      write({ ...state, layouts, activeIndex: layouts.length - 1 });
    }, [state, active, write]);
    const renameLayout = useCallback((name) => { mutateActive((l) => { l.name = name; return l; }, false); }, [mutateActive]);
    const togglePublished = useCallback(() => { mutateActive((l) => { l.published = !l.published; return l; }); }, [mutateActive]);
    const deleteLayout = useCallback((i) => { if (state.layouts.length <= 1) return; const layouts = state.layouts.filter((_, k) => k !== i); write({ ...state, layouts, activeIndex: Math.max(0, Math.min(layouts.length-1, state.activeIndex >= i ? state.activeIndex-1 : state.activeIndex)) }); }, [state, write]);

    const resetAll = useCallback(() => { const s = store.reset(); past.current = []; future.current = []; setState(s); force((n)=>n+1); }, []);

    return {
      state, active, activeIndex: state.activeIndex, layouts: state.layouts,
      updateObjects, addObject, deleteObjects, duplicateObjects,
      addComment, resolveComment, addMeasurement, deleteMeasurement, clearMeasurements, importState, setEmergency,
      undo, redo, beginChange, canUndo: past.current.length > 0, canRedo: future.current.length > 0,
      setActiveIndex, duplicateLayout, renameLayout, togglePublished, deleteLayout, resetAll,
    };
  }
  window.useStudio = useStudio;
})();
