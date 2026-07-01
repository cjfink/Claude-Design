/* main.jsx — hash router, toast, mount. */
(function () {
  const { useState, useEffect } = React;

  /* ---- tiny toast ---- */
  function ToastHost() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      window.toast = (msg, kind) => {
        const id = Math.random().toString(36).slice(2);
        setItems((it) => [...it, { id, msg, kind }]);
        setTimeout(() => setItems((it) => it.filter((x) => x.id !== id)), 2400);
      };
    }, []);
    return (
      <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 200, alignItems: "center", pointerEvents: "none" }}>
        {items.map((t) => (
          <div key={t.id} style={{ background: t.kind === "err" ? "#7a2d1e" : "#181818", color: "#EBE5DB", padding: "9px 16px", borderRadius: 2, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.04em", boxShadow: "var(--shadow-lift)", animation: "tccfToast 240ms cubic-bezier(0.2,0.7,0.2,1)" }}>{t.msg}</div>
        ))}
      </div>
    );
  }

  function useHashRoute() {
    const [route, setRoute] = useState(location.hash.replace(/^#/, "") || "/map");
    useEffect(() => {
      const onHash = () => setRoute(location.hash.replace(/^#/, "") || "/map");
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);
    return route;
  }

  function App() {
    const route = useHashRoute();
    const data = window.useMapData();
    const [unlocked, setUnlocked] = useState(sessionStorage.getItem("tccf_org_unlocked") === "1");

    const isOrganizer = route === "/organizer" || route.indexOf("/organizer") === 0;

    let view;
    if (isOrganizer) {
      if (!unlocked) view = <window.PinGate onUnlock={() => setUnlocked(true)} />;
      else view = <window.OrganizerMap data={data} onLogout={() => { sessionStorage.removeItem("tccf_org_unlocked"); setUnlocked(false); location.hash = "#/map"; }} />;
    } else {
      view = <window.PublicMap objects={data.objects} lot={data.lot} loading={data.loading} />;
    }

    return <React.Fragment>{view}<ToastHost /></React.Fragment>;
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
