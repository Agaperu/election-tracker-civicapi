import React, { useEffect, useState } from "react";
import { civicApi } from "../api";

export default function Header({ selectedCount = 0, onClearSelected }) {
  const [status, setStatus] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    civicApi
      .status()
      .then((d) => {
        setStatus(d);
        setErr(null);
      })
      .catch((e) => setErr(e));
  }, []);

  return (
    <div className="card row between">
      <div>
        <h1>civicAPI Live Election Results Dashboard</h1>
        <div className="muted" style={{ marginTop: 6 }}>
          Home view: <b>US races today</b>. Multi-select races to view them simultaneously.
        </div>
      </div>

      <div className="row">
        <div className="pill" title="Selected races">
          <span className="dot" />
          Selected: <b>{selectedCount}</b>
        </div>

        {selectedCount > 0 ? (
          <button className="secondary" onClick={onClearSelected}>
            Clear selected
          </button>
        ) : null}

        {err ? (
          <div className="pill">
            <span className="dot" style={{ background: "#b91c1c" }} />
            API status error
          </div>
        ) : status?.status === "ok" ? (
          <div className="pill">
            <span className="dot" style={{ background: "#10b981" }} />
            API ok
          </div>
        ) : (
          <div className="pill">
            <span className="dot" />
            checking…
          </div>
        )}
      </div>
    </div>
  );
}
