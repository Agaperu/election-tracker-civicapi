import React, { useMemo } from "react";

function pct(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return `${Number(n).toFixed(2)}%`;
}

function safeNum(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function CandidateTable({ candidates = [] }) {
  const sorted = useMemo(() => {
    const list = Array.isArray(candidates) ? candidates : [];
    return [...list].sort((a, b) => safeNum(b.votes) - safeNum(a.votes));
  }, [candidates]);

  const totalVotes = useMemo(() => sorted.reduce((s, c) => s + safeNum(c.votes), 0), [sorted]);

  return (
    <div>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Candidates</h3>
        <div className="pill">
          <span className="dot" />
          Total votes: <b>{totalVotes.toLocaleString()}</b>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 22 }}></th>
            <th>Name</th>
            <th>Party</th>
            <th>Votes</th>
            <th>Percent</th>
            <th style={{ width: 220 }}>Share</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, idx) => {
            const color = c.color || "#9ca3af";
            const percent = safeNum(c.percent);
            const winner = Boolean(c.winner);

            return (
              <tr key={`${c.name}-${idx}`}>
                <td>
                  <span className="dot" style={{ background: color }} title={color} />
                </td>
                <td style={{ fontWeight: 700 }}>
                  {c.name} {winner ? "🏆" : ""}
                  {c.incumbent ? <span className="muted"> (inc.)</span> : null}
                </td>
                <td>{c.party || "—"}</td>
                <td>{safeNum(c.votes).toLocaleString()}</td>
                <td>{pct(percent)}</td>
                <td>
                  <div className="bar" aria-label="vote share bar">
                    <div style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
                  </div>
                </td>
              </tr>
            );
          })}
          {!sorted.length ? (
            <tr>
              <td colSpan={6} className="muted">
                No candidate data yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
