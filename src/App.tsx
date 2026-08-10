import { useState, useEffect, useRef, useCallback } from "react";
import ControlsHint from "./ControlsHint.tsx";

interface ICharacter {
  id: number;
  name: string;
  source: string;
  wins: number;
  losses: number;
  elo: number;
}

interface IMatchHistory {
  prevCharacters: ICharacter[];
  prevLeft: ICharacter;
  prevRight: ICharacter;
  winnerName: string;
  loserName: string;
}

const K_FACTOR = 48;

function calculateNewElo(
  winnerId: number,
  loserId: number,
  characters: ICharacter[],
): ICharacter[] {
  const charCopy = [...characters];
  const winner = charCopy.find((c) => c.id === winnerId)!;
  const loser = charCopy.find((c) => c.id === loserId)!;

  const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400));

  winner.elo = Math.round(winner.elo + K_FACTOR * (1 - expectedWinner));
  loser.elo = Math.round(loser.elo + K_FACTOR * (0 - expectedLoser));

  return charCopy;
}

function parseCSV(
  csvContent: string,
): Omit<ICharacter, "wins" | "losses" | "elo">[] {
  const lines = csvContent.trim().split("\n");
  const dataLines = lines.slice(1);

  return dataLines
    .map((line) => {
      const fields: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      fields.push(current.trim());

      const id = parseInt(fields[0]) || 0;
      const name = fields[1] || "Unknown";
      const source = fields[2] || "Unknown";

      return { id, name, source };
    })
    .filter((c) => c.id > 0);
}

export default function App() {
  const [characters, setCharacters] = useState<ICharacter[]>([]);
  const [leftChar, setLeftChar] = useState<ICharacter | null>(null);
  const [rightChar, setRightChar] = useState<ICharacter | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [lastMatch, setLastMatch] = useState<IMatchHistory | null>(null);
  const [topTenNotices, setTopTenNotices] = useState<
    {
      name: string;
      type: "in" | "out";
    }[]
  >([]);
  const topTenRef = useRef<number[]>([]); // Store IDs of previous top 10
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickNewPair = useCallback(() => {
    if (characters.length < 2) return;

    let leftIndex, rightIndex;
    do {
      leftIndex = Math.floor(Math.random() * characters.length);
      rightIndex = Math.floor(Math.random() * characters.length);
    } while (leftIndex === rightIndex);

    setLeftChar(characters[leftIndex]);
    setRightChar(characters[rightIndex]);
  }, [characters]);

  useEffect(() => {
    const saved = localStorage.getItem("battleCharacters");
    let initialChars: ICharacter[];

    if (saved) {
      initialChars = JSON.parse(saved);
    } else {
      initialChars = [
        {
          id: 1,
          name: "Edward Elric",
          source: "Fullmetal Alchemist",
          wins: 0,
          losses: 0,
          elo: 1000,
        },
        {
          id: 2,
          name: "Lae'zel",
          source: "Baldur's Gate 3",
          wins: 0,
          losses: 0,
          elo: 1000,
        },
        {
          id: 3,
          name: "Corin Cadence",
          source: "Arcane Ascension",
          wins: 0,
          losses: 0,
          elo: 1000,
        },
        {
          id: 4,
          name: "Cassian Andor",
          source: "Andor",
          wins: 0,
          losses: 0,
          elo: 1000,
        },
      ];
    }

    setCharacters(initialChars);
  }, []);

  useEffect(() => {
    if (characters.length >= 2 && !loaded) {
      pickNewPair();
      setLoaded(true);
    }
  }, [characters]);

  useEffect(() => {
    if (characters.length > 0) {
      localStorage.setItem("battleCharacters", JSON.stringify(characters));
    }
  }, [characters]);

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseCSV(content);

      if (parsedData.length === 0) {
        alert("No valid characters found in CSV!");
        return;
      }

      setCharacters((prev) => {
        // Keep characters with match history, drop untouched defaults
        const battledChars = prev.filter((c) => c.wins > 0 || c.losses > 0);

        const existingIds = new Set(battledChars.map((c) => c.id));
        const newCharacters: ICharacter[] = parsedData
          .filter((c) => !existingIds.has(c.id))
          .map((c) => ({ ...c, wins: 0, losses: 0, elo: 1000 }));

        const merged = [...battledChars, ...newCharacters];

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        const droppedCount = prev.length - battledChars.length;
        alert(
          `Imported ${newCharacters.length} character(s).\n` +
            `${droppedCount > 0 ? `Removed ${droppedCount} demo character(s) with no match history.` : ""}`,
        );
        return merged;
      });
    };

    reader.readAsText(file);
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleVote = useCallback(
    (winnerId: number) => {
      if (!leftChar || !rightChar) return;

      const loserId = winnerId === leftChar.id ? rightChar.id : leftChar.id;
      const winner = characters.find((c) => c.id === winnerId)!;
      const loser = characters.find((c) => c.id === loserId)!;

      setLastMatch({
        prevCharacters: characters.map((c) => ({ ...c })),
        prevLeft: { ...leftChar },
        prevRight: { ...rightChar },
        winnerName: winner.name,
        loserName: loser.name,
      });

      const updatedChars = calculateNewElo(winnerId, loserId, characters);
      const winnersIndex = updatedChars.findIndex((c) => c.id === winnerId);
      const losersIndex = updatedChars.findIndex((c) => c.id === loserId);
      updatedChars[winnersIndex].wins++;
      updatedChars[losersIndex].losses++;

      // --- TOP 10 NOTICE LOGIC STARTS HERE ---
      const MIN_CHARS_FOR_TOP_TEN_NOTICES = 30;

      if (updatedChars.length >= MIN_CHARS_FOR_TOP_TEN_NOTICES) {
        const newSorted = [...updatedChars].sort((a, b) => b.elo - a.elo);
        const newTopTenIds = newSorted.slice(0, 10).map((c) => c.id);
        const prevTopTenIds = topTenRef.current;

        const entered = newTopTenIds.filter(
          (id) => !prevTopTenIds.includes(id),
        );
        const exited = prevTopTenIds.filter((id) => !newTopTenIds.includes(id));

        const notices: { name: string; type: "in" | "out" }[] = [
          ...entered.map((id) => ({
            name: updatedChars.find((c) => c.id === id)?.name || "",
            type: "in" as const,
          })),
          ...exited.map((id) => ({
            name: updatedChars.find((c) => c.id === id)?.name || "",
            type: "out" as const,
          })),
        ];

        if (notices.length > 0) {
          setTopTenNotices(notices);
          //setTimeout(() => setTopTenNotices([]), 5000);
        }

        topTenRef.current = newTopTenIds;
      }
      // --- TOP 10 NOTICE LOGIC ENDS HERE ---

      setCharacters([...updatedChars]);
      pickNewPair();
    },
    [leftChar, rightChar, characters, pickNewPair], // ← Note: removed topTenNotices from deps
  );

  const handleUndo = useCallback(() => {
    if (!lastMatch) return;

    setCharacters(lastMatch.prevCharacters);
    setLeftChar(lastMatch.prevLeft);
    setRightChar(lastMatch.prevRight);
    setLastMatch(null);
  }, [lastMatch]);

  const resetData = () => {
    if (confirm("Are you sure? This will delete all battle history!")) {
      localStorage.removeItem("battleCharacters");
      window.location.reload();
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(characters, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "battle_characters.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard shortcuts: ← left, → right, ↑ undo, ↓ skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          if (leftChar) handleVote(leftChar.id);
          break;
        case "ArrowRight":
          e.preventDefault();
          if (rightChar) handleVote(rightChar.id);
          break;
        case "ArrowUp":
          e.preventDefault();
          handleUndo();
          break;
        case "ArrowDown":
          e.preventDefault();
          pickNewPair();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leftChar, rightChar, handleVote, handleUndo, pickNewPair]);

  if (characters.length < 2 || !leftChar || !rightChar) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "system-ui",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        ⚔️ Who Would Win?
      </h1>

      {/* Last Match Banner + Undo */}
      {lastMatch && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            padding: "0.75rem 1.25rem",
            marginBottom: "1.5rem",
            backgroundColor: "#fff8e1",
            border: "1px solid #ffe082",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "0.9rem", color: "#5d4037" }}>
            ⏪ Last match: <strong>{lastMatch.winnerName}</strong> beat{" "}
            <strong>{lastMatch.loserName}</strong>
          </span>
          <button
            onClick={handleUndo}
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.85rem",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            ↩️ Undo Vote
          </button>
        </div>
      )}

      {/* Top 10 Movement Notice */}
      {topTenNotices.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            marginBottom: "1.5rem",
            backgroundColor: "#e8f5e9",
            border: "1px solid #81c784",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>📈</span>
          <span style={{ fontSize: "0.9rem", color: "#2e7d32" }}>
            {topTenNotices.map((n, i) => (
              <span key={i}>
                <strong>{n.name}</strong>{" "}
                {n.type === "in" ? "moved into" : "fell out of"} top 10
                {i < topTenNotices.length - 1 ? ", " : ""}
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Import/Export Controls */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          marginBottom: "2rem",
          flexWrap: "wrap",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileImport}
          style={{ display: "none" }}
        />

        <button
          onClick={triggerImport}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          📥 Import CSV
        </button>

        <button
          onClick={exportData}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          💾 Export Backup
        </button>

        <button
          onClick={resetData}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            backgroundColor: "#ff4757",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          🗑️ Reset
        </button>
      </div>

      <ControlsHint />

      {/* Battle Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        <div
          onClick={() => handleVote(leftChar.id)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.02)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            border: "2px solid #ddd",
            borderRadius: "12px",
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "black", margin: "0 0 0.5rem" }}>
            {leftChar.name}
          </h2>
          <p style={{ color: "#666", margin: 0 }}>{leftChar.source}</p>
          <div style={{ marginTop: "1rem" }}>
            <strong>ELO: {leftChar.elo}</strong>
            <br />
            Record: {leftChar.wins}W - {leftChar.losses}L
          </div>
        </div>

        <div
          onClick={() => handleVote(rightChar.id)}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "scale(1.02)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          style={{
            border: "2px solid #ddd",
            borderRadius: "12px",
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            cursor: "pointer",
            transition: "transform 0.2s",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "black", margin: "0 0 0.5rem" }}>
            {rightChar.name}
          </h2>
          <p style={{ color: "#666", margin: 0 }}>{rightChar.source}</p>
          <div style={{ marginTop: "1rem" }}>
            <strong>ELO: {rightChar.elo}</strong>
            <br />
            Record: {rightChar.wins}W - {rightChar.losses}L
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#ff4757",
          marginBottom: "2rem",
        }}
      >
        VS
      </div>

      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <button
          onClick={pickNewPair}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            backgroundColor: "#6d4aff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(109, 78, 255, 0.3)",
          }}
        >
          Skip →
        </button>
      </div>

      {/* Leaderboard */}
      <div style={{ marginTop: "3rem" }}>
        <h2>🏆 Leaderboard ({characters.length} characters)</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #eee" }}>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Rank</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
                <th style={{ padding: "0.75rem", textAlign: "left" }}>
                  Source
                </th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>ELO</th>
                <th style={{ padding: "0.75rem", textAlign: "right" }}>
                  Win Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {[...characters]
                .sort((a, b) => b.elo - a.elo)
                .slice(0, 20)
                .map((char, index) => {
                  const totalMatches = char.wins + char.losses;
                  const winRate =
                    totalMatches > 0
                      ? ((char.wins / totalMatches) * 100).toFixed(0)
                      : 0;

                  return (
                    <tr
                      key={char.id}
                      style={{ borderBottom: "1px solid #eee" }}
                    >
                      <td
                        style={{
                          padding: "0.75rem",
                          fontWeight: index < 3 ? "bold" : "normal",
                        }}
                      >
                        {index + 1}
                      </td>
                      <td style={{ padding: "0.75rem" }}>{char.name}</td>
                      <td
                        style={{
                          padding: "0.75rem",
                          color: "#666",
                          fontSize: "0.9rem",
                        }}
                      >
                        {char.source}
                      </td>
                      <td
                        style={{
                          padding: "0.75rem",
                          textAlign: "right",
                          fontWeight: "bold",
                        }}
                      >
                        {char.elo}
                      </td>
                      <td style={{ padding: "0.75rem", textAlign: "right" }}>
                        {totalMatches > 0 ? `${winRate}%` : "N/A"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Instructions */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderRadius: "8px",
          fontSize: "0.85rem",
          color: "#666",
        }}
      >
        <strong>📋 How to Import CSV:</strong>
        <ol style={{ margin: "0.5rem 0 0 1.5rem" }}>
          <li>
            In Google Sheets, go to{" "}
            <em>File → Download → Comma-separated values (.csv)</em>
          </li>
          <li>
            Ensure columns are in order: <code>ID</code>, <code>Name</code>,{" "}
            <code>Source</code>, <code>Source Type</code> (optional)
          </li>
          <li>
            Click <strong>📥 Import CSV</strong> button above and select the
            downloaded file
          </li>
          <li>
            New characters are added with ELO 1000; existing IDs keep their
            stats
          </li>
        </ol>
      </div>
    </div>
  );
}
