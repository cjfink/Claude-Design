/* hooks.jsx — useMapData: localStorage-backed state with optimistic
   updates, 50-step undo, and live cross-tab sync. */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const store = window.TCCF.store;
  const HISTORY_LIMIT = 50;

  function useMapData() {
    const init = store.load();
    const [objects, setObjects] = useState(init.objects);
    const [lot, setLot] = useState(init.lot);
    const [loading] = useState(false);
    const history = useRef([]);
    const [historyLen, setHistoryLen] = useState(0);
    const localWrite = useRef(false);

    // Listen for changes from other tabs / the store
    useEffect(() => {
      return store.subscribe(({ objects, lot }) => {
        if (localWrite.current) return; // ignore our own echoes
        setObjects(objects); if (lot) setLot(lot);
      });
    }, []);

    const commit = useCallback((nextObjects, nextLot) => {
      localWrite.current = true;
      setObjects(nextObjects);
      if (nextLot) setLot(nextLot);
      store.save(nextObjects, nextLot || lot);
      setTimeout(() => { localWrite.current = false; }, 0);
    }, [lot]);

    const pushHistory = useCallback((snap) => {
      history.current.push(snap.map((o) => ({ ...o })));
      if (history.current.length > HISTORY_LIMIT) history.current.shift();
      setHistoryLen(history.current.length);
    }, []);

    const updateObject = useCallback((id, patch) => {
      setObjects((prev) => {
        pushHistory(prev);
        const next = prev.map((o) => (o.id === id ? { ...o, ...patch } : o));
        store.save(next, lot); localWrite.current = true;
        setTimeout(() => { localWrite.current = false; }, 0);
        return next;
      });
    }, [lot, pushHistory]);

    const addObject = useCallback((obj) => {
      let newId;
      setObjects((prev) => {
        pushHistory(prev);
        newId = (prev.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1;
        const next = [...prev, { ...obj, id: newId }];
        store.save(next, lot); localWrite.current = true;
        setTimeout(() => { localWrite.current = false; }, 0);
        return next;
      });
      return newId;
    }, [lot, pushHistory]);

    const deleteObject = useCallback((id) => {
      setObjects((prev) => {
        pushHistory(prev);
        const next = prev.filter((o) => o.id !== id);
        store.save(next, lot); localWrite.current = true;
        setTimeout(() => { localWrite.current = false; }, 0);
        return next;
      });
    }, [lot, pushHistory]);

    const undo = useCallback(() => {
      const prev = history.current.pop();
      setHistoryLen(history.current.length);
      if (!prev) return;
      commit(prev, lot);
    }, [commit, lot]);

    const reset = useCallback(() => {
      pushHistory(objects);
      const data = store.resetToSeed();
      setObjects(data.objects); setLot(data.lot);
    }, [objects, pushHistory]);

    return { objects, lot, loading, updateObject, addObject, deleteObject, undo, canUndo: historyLen > 0, reset };
  }

  window.useMapData = useMapData;
})();
