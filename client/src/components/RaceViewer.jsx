import React, { useMemo, useState } from "react";
import { civicApi } from "../api";
import { usePolling } from "../hooks/usePolling";
import CandidateTable from "./CandidateTable";
import HistoryPanel from "./HistoryPanel";

function pill(label, value) {
  return (
    <div className="pill" title={label}>
      <span className="dot" />
      <span className="muted">{label}:</span> <b>{value ?? "—"}</b>
    </div>
  );
}

export default function RaceViewer({ race, onRemove }) {
  const [pollMs, setPollMs] = useState(52_000);
  const [includePrecinct, setIncludePrecinct] = useState(false);

  const raceId = race?.id;

  const { data, error, loading } = usePolling(
    async () => {
      if (!raceId) return null;
      return civicApi.getRace(raceId, includePrecinct ? { precinct: "1" } : {});
    },
    { enabled: Boolean(raceId), intervalMs: pollMs, deps: [raceId, pollMs, includePrecinct] }
  );

  const header = useMemo(() => {
    if (!data) return null;

    const electionName = data.election_name ?? race?.election_name ?? "Race";
    const dateStr = data.election_date ? new Date(data.election_date).toLocaleString() : "—";

    return { electionName, dateStr };
  }, [data, race]);

  if (!raceId) return null;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="row between">
          <div style={{ minWidth: 0 }}>
            <h2 style={{ marginBottom: 6 }}>
              {header?.electionName || race?.election_name || `Race ${raceId}`}
            </h2>
            <div className="muted">
              Race ID <b>{raceId}</b> • {header?.dateStr || new Date(race.election_date).toLocaleString()}
            </div>
          </div>

          <div className="row">
            <button className="danger" onClick={() => onRemove?.(raceId)} title="Remove from selected">
              Remove
            </button>
          </div>
        </div>

        <div className="row" style={{ marginTop: 10 }}>
          <label className="row" title="Polling interval">
            <small className="muted">Poll (ms)</small>
            <input
              type="number"
              min={2000}
              step={1000}
              value={pollMs}
              onChange={(e) => setPollMs(Number(e.target.value))}
              style={{ width: 120 }}
            />
          </label>

          <label className="row" title="Include precinct data (can be large)">
            <input
              type="checkbox"
              checked={includePrecinct}
              onChange={(e) => setIncludePrecinct(e.target.checked)}
            />
            <small className="muted">Include precinct</small>
          </label>

          {loading ? (
            <div className="pill">
              <span className="dot" />
              updating…
            </div>
          ) : (
            <div className="pill">
              <span className="dot" style={{ background: "#10b981" }} />
              live
            </div>
          )}

          {data ? (
            <>
              {pill("Type", data.type || race.type)}
              {pill("Scope", data.scope)}
              {pill("Called", String(Boolean(data.called)))}
              {pill("Disputed", String(Boolean(data.disputed)))}
              {pill("Round", data.round)}
            </>
          ) : null}
        </div>

        {error ? (
          <div className="error" style={{ marginTop: 12 }}>
            Live fetch failed: {error.message}
            {error.status === 429 ? (
              <div className="muted" style={{ marginTop: 6 }}>
                You hit the local rate limit. Increase polling interval or reduce selections.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="card">
        <CandidateTable candidates={data?.candidates || race?.candidates || []} />
      </div>

      <HistoryPanel raceId={raceId} />
    </div>
  );
}
