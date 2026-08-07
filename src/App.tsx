import { useState, useEffect } from "react";

interface ICharacter {
  id: number;
  name: string;
  source: string;
  wins: number;
  losses: number;
  elo: number;
}

const K_FACTOR = 32; // Standard for casual ELO systems

// Calculate new ELO ratings after a match
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

export default function App() {
  const [characters, setCharacters] = useState<ICharacter[]>([
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
      name: "Laezel",
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
  ]);

  const [leftChar, setLeftChar] = useState<ICharacter | null>(null);
  const [rightChar, setRightChar] = useState<ICharacter | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("battleCharacters");
    if (saved) {
      setCharacters(JSON.parse(saved));
    }
    pickNewPair();
  }, []);

  // Save to localStorage whenever characters change
  useEffect(() => {
    localStorage.setItem("battleCharacters", JSON.stringify(characters));
  }, [characters]);

  // Pick two random characters for comparison
  const pickNewPair = () => {
    if (characters.length < 2) return;

    let leftIndex, rightIndex;
    do {
      leftIndex = Math.floor(Math.random() * characters.length);
      rightIndex = Math.floor(Math.random() * characters.length);
    } while (leftIndex === rightIndex);

    setLeftChar(characters[leftIndex]);
    setRightChar(characters[rightIndex]);
  };

  // Handle voting
  const handleVote = (winnerId: number) => {
    const loserId = winnerId === leftChar!.id ? rightChar!.id : leftChar!.id;

    const updatedChars = calculateNewElo(winnerId, loserId, characters);
    setCharacters(updatedChars);

    // Increment/decrement win/loss stats
    const winnersIndex = updatedChars.findIndex((c) => c.id === winnerId);
    const losersIndex = updatedChars.findIndex((c) => c.id === loserId);
    updatedChars[winnersIndex].wins++;
    updatedChars[losersIndex].losses++;

    setCharacters([...updatedChars]);
    pickNewPair();
  };

  // Reset all data
  const resetData = () => {
    localStorage.removeItem("battleCharacters");
    window.location.reload();
  };

  if (!leftChar || !rightChar) return <div>Loading...</div>;

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

      {/* Battle Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          marginBottom: "2rem",
        }}
      >
        {/* Left Character */}
        <div
          style={{
            border: "2px solid #ddd",
            borderRadius: "12px",
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            transition: "transform 0.2s",
            cursor: "pointer",
          }}
          onClick={() => handleVote(leftChar.id)}
        >
          <h2 style={{ margin: "0 0 0.5rem" }}>{leftChar.name}</h2>
          <p style={{ color: "#666", margin: 0 }}>{leftChar.source}</p>
          <div style={{ marginTop: "1rem" }}>
            <strong>ELO: {leftChar.elo}</strong>
            <br />
            Record: {leftChar.wins}W - {leftChar.losses}L
          </div>
        </div>

        {/* Right Character */}
        <div
          style={{
            border: "2px solid #ddd",
            borderRadius: "12px",
            padding: "1.5rem",
            backgroundColor: "#fafafa",
            cursor: "pointer",
          }}
          onClick={() => handleVote(rightChar.id)}
        >
          <h2 style={{ margin: "0 0 0.5rem" }}>{rightChar.name}</h2>
          <p style={{ color: "#666", margin: 0 }}>{rightChar.source}</p>
          <div style={{ marginTop: "1rem" }}>
            <strong>ELO: {rightChar.elo}</strong>
            <br />
            Record: {rightChar.wins}W - {rightChar.losses}L
          </div>
        </div>
      </div>

      {/* VS Badge */}
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

      {/* Control Buttons */}
      <div
        style={{
          textAlign: "center",
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
        }}
      >
        <button
          onClick={pickNewPair}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#6d4aff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Skip →
        </button>
        <button
          onClick={resetData}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: "#ff4757",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Reset All Data
        </button>
      </div>

      {/* Leaderboard Preview */}
      <div style={{ marginTop: "3rem" }}>
        <h2>🏆 Leaderboard</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Rank</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.5rem", textAlign: "left" }}>Source</th>
              <th style={{ padding: "0.5rem", textAlign: "right" }}>ELO</th>
              <th style={{ padding: "0.5rem", textAlign: "right" }}>Record</th>
            </tr>
          </thead>
          <tbody>
            {[...characters]
              .sort((a, b) => b.elo - a.elo)
              .map((char, index) => (
                <tr key={char.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "0.5rem" }}>{index + 1}</td>
                  <td style={{ padding: "0.5rem" }}>{char.name}</td>
                  <td style={{ padding: "0.5rem" }}>{char.source}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    {char.elo}
                  </td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>
                    {char.wins}-{char.losses} ({char.wins + char.losses})
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
