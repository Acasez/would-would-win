import { type ICharacter } from "../App";
// Leaderboard.tsx
interface LeaderboardProps {
  characters: ICharacter[];
}

const CHARACTERS_TO_DISPLAY = 10;

export default function Leaderboard({ characters }: LeaderboardProps) {
  return (
    <div style={{ marginTop: "3rem" }}>
      <h2>🏆 Leaderboard ({characters.length} characters)</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #eee" }}>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Rank</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Name</th>
              <th style={{ padding: "0.75rem", textAlign: "left" }}>Source</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>ELO</th>
              <th style={{ padding: "0.75rem", textAlign: "right" }}>
                Win Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {[...characters]
              .sort((a, b) => b.elo - a.elo)
              .slice(0, CHARACTERS_TO_DISPLAY)
              .map((char, index) => {
                const totalMatches = char.wins + char.losses;
                const winRate =
                  totalMatches > 0
                    ? ((char.wins / totalMatches) * 100).toFixed(0)
                    : 0;

                return (
                  <tr key={char.id} style={{ borderBottom: "1px solid #eee" }}>
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
  );
}
