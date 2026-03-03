import React, { useEffect, useMemo, useState } from "react";
import { civicApi } from "../api";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function RaceSearch({ selectedRaceIds = [], onToggleRace }) {
  const [filters, setFilters] = useState(() => {
    const t = todayISO();
    return {
      startDate: t,
      endDate: t,
      query: "",
      country: "US",
      province: "",
      district: "",
      election_type: "",
      limit: 1000
    };
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  const races = useMemo(() => results?.races || [], [results]);
  const normalizedQuery = filters.query.trim().toLowerCase();
  const visibleRaces = useMemo(() => {
    if (!normalizedQuery) return races;

    return races.filter((race) => {
      const haystacks = [
        race.election_name,
        race.type,
        race.office,
        race.office_name,
        race.seat_name,
        race.district,
        race.municipality,
        race.province
      ];

      return haystacks.some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery, races]);

  async function runSearch(e) {
    e?.preventDefault?.();
    setLoading(true);
    setError(null);
    try {
      const expandedLimit = normalizedQuery ? Math.max(Number(filters.limit) || 0, 5000) : filters.limit;
      const data = await civicApi.searchRaces({
        ...filters,
        query: "",
        limit: expandedLimit
      });
      setResults(data);
    } catch (err) {
      setError(err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  // Home view: auto-run search on mount (US today)
  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedSet = useMemo(() => new Set(selectedRaceIds.map(String)), [selectedRaceIds]);

  return (
    <div className="card">
      <h2>Search races</h2>

      <form className="grid" onSubmit={runSearch}>
        <div className="row">
          <label className="grid" style={{ flex: 1 }}>
            <small>Start date (YYYY-MM-DD)</small>
            <input
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              placeholder="2025-10-21"
            />
          </label>
          <label className="grid" style={{ flex: 1 }}>
            <small>End date (YYYY-MM-DD)</small>
            <input
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              placeholder="2025-10-21"
            />
          </label>
        </div>

        <label className="grid">
          <small>Query (race name contains)</small>
          <input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            placeholder="e.g. Governor, Mayor, State House..."
          />
        </label>

        <div className="row">
          <label className="grid" style={{ width: 110 }}>
            <small>Country</small>
            <input
              value={filters.country}
              onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value.toUpperCase() }))}
              placeholder="US"
            />
          </label>

          <label className="grid" style={{ width: 110 }}>
            <small>Province</small>
            <input
              value={filters.province}
              onChange={(e) => setFilters((f) => ({ ...f, province: e.target.value.toUpperCase() }))}
              placeholder="NY"
            />
          </label>

          <label className="grid" style={{ flex: 1 }}>
            <small>District (full English name or null)</small>
            <input
              value={filters.district}
              onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
              placeholder='e.g. "Kings County" or "null"'
            />
          </label>
        </div>

        <div className="row">
          <label className="grid" style={{ flex: 1 }}>
            <small>Election type (optional)</small>
            <input
              value={filters.election_type}
              onChange={(e) => setFilters((f) => ({ ...f, election_type: e.target.value }))}
              placeholder="Primary / Runoff / General / Local..."
            />
          </label>

          <label className="grid" style={{ width: 120 }}>
            <small>Limit</small>
            <input
              type="number"
              value={filters.limit}
              min={1}
              max={10000}
              onChange={(e) => setFilters((f) => ({ ...f, limit: Number(e.target.value) }))}
            />
          </label>
        </div>

        <div className="row">
          <button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setResults(null);
              setError(null);
            }}
          >
            Clear results
          </button>
        </div>

        {error ? <div className="error">Search failed: {error.message}</div> : null}
        {results ? (
          <div className="success">
            {normalizedQuery ? (
              <>
                Showing <b>{visibleRaces.length}</b> of <b>{races.length}</b> fetched race(s). Query matched
                race names locally.
              </>
            ) : (
              <>
                Found <b>{results.count}</b> race(s). Click to toggle selection.
              </>
            )}
          </div>
        ) : null}
      </form>

      {visibleRaces.length ? (
        <>
          <h3 style={{ marginTop: 14 }}>Results</h3>
          <div className="list">
            {visibleRaces.map((r) => {
              const active = selectedSet.has(String(r.id));
              return (
                <div
                  key={r.id}
                  className={"raceItem" + (active ? " active" : "")}
                  onClick={() => onToggleRace(r)}
                  role="button"
                  tabIndex={0}
                  title="Click to toggle selection"
                >
                  <div className="row between" style={{ gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {active ? "✓ " : ""}{r.election_name}
                      </div>
                      <div className="muted" style={{ marginTop: 4 }}>
                        {r.type} • {r.country}
                        {r.province ? `-${r.province}` : ""} • {new Date(r.election_date).toLocaleString()}
                      </div>
                    </div>
                    <div className="pill">
                      <span className="dot" />
                      ID {r.id}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : results && !loading ? (
        <div className="muted" style={{ marginTop: 14 }}>
          No races matched the current query.
        </div>
      ) : null}
    </div>
  );
}
