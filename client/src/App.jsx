import React, { useMemo, useState } from "react";
import Header from "./components/Header";
import RaceSearch from "./components/RaceSearch";
import RaceViewer from "./components/RaceViewer";

export default function App() {
  // Store selected races as an id->race object map for stable rendering
  const [selected, setSelected] = useState({});

  const selectedIds = useMemo(() => Object.keys(selected), [selected]);
  const selectedRaces = useMemo(() => selectedIds.map((id) => selected[id]).filter(Boolean), [selected, selectedIds]);

  function toggleRace(race) {
    const id = String(race.id);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = race;
      }
      return next;
    });
  }

  function removeRace(id) {
    const rid = String(id);
    setSelected((prev) => {
      if (!prev[rid]) return prev;
      const next = { ...prev };
      delete next[rid];
      return next;
    });
  }

  function clearSelected() {
    setSelected({});
  }

  return (
    <div className="container grid" style={{ gap: 14 }}>
      <Header selectedCount={selectedIds.length} onClearSelected={clearSelected} />

      <div className="grid cols-2">
        <RaceSearch selectedRaceIds={selectedIds} onToggleRace={toggleRace} />

        <div className="grid" style={{ gap: 14 }}>
          {selectedRaces.length === 0 ? (
            <div className="card">
              <h2>Selected races</h2>
              <div className="muted">
                Click races on the left to select multiple and view them here.
              </div>
            </div>
          ) : (
            <div className="cardsGrid">
              {selectedRaces.map((race) => (
                <div key={race.id}>
                  <RaceViewer race={race} onRemove={removeRace} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="muted" style={{ paddingBottom: 20 }}>
        Data source: civicAPI. For non-personal projects, provide attribution per civicAPI documentation.
      </div>
    </div>
  );
}
