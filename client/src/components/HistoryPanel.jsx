import React, { useEffect, useState } from "react";
import { civicApi } from "../api";

export default function HistoryPanel({ raceId }) {
  const [timestamps, setTimestamps] = useState([]);
  const [selectedTs, setSelectedTs] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [loadingTs, setLoadingTs] = useState(false);
  const [loadingSnap, setLoadingSnap] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!raceId) return;
    setErr(null);
    setSnapshot(null);
    setSelectedTs("");
    setLoadingTs(true);
    civicApi
      .getHistory(raceId)
      .then((d) => {
        const list = Array.isArray(d) ? d : d?.timestamps || [];
        setTimestamps(list);
      })
      .catch((e) => setErr(e))
      .finally(() => setLoadingTs(false));
  }, [raceId]);

  async function loadSnapshot() {
    if (!selectedTs) return;
    setLoadingSnap(true);
    setErr(null);
    try {
      const d = await civicApi.getHistory(raceId, selectedTs);
      setSnapshot(d);
    } catch (e) {
      setErr(e);
    } finally {
      setLoadingSnap(false);
    }
  }

  return (
    <div className="card">
      <h2>History (optional)</h2>
      <div className="muted" style={{ marginBottom: 10 }}>
        civicAPI history is available only for races tracked after Oct 9, 2025.
      </div>

      {err ? <div className="error">History error: {err.message}</div> : null}

      <div className="row">
        <select value={selectedTs} onChange={(e) => setSelectedTs(e.target.value)} style={{ flex: 1 }}>
          <option value="">{loadingTs ? "Loading timestamps…" : "Select a timestamp…"}</option>
          {timestamps.map((ts) => (
            <option key={ts} value={ts}>
              {ts}
            </option>
          ))}
        </select>
        <button onClick={loadSnapshot} disabled={!selectedTs || loadingSnap}>
          {loadingSnap ? "Loading…" : "Load snapshot"}
        </button>
      </div>

      {snapshot ? (
        <pre
          style={{
            marginTop: 12,
            background: "#0b1020",
            color: "white",
            padding: 12,
            borderRadius: 12,
            overflowX: "auto",
            fontSize: 12
          }}
        >
{JSON.stringify(snapshot, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
