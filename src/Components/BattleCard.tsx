import { type ICharacter } from "../App";

interface BattleCardProps {
  character: ICharacter;
  handleVote: (characterId: number) => void;
}

export default function BattleCard({ character, handleVote }: BattleCardProps) {
  return (
    <div
      onClick={() => handleVote(character.id)}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
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
      <h2 style={{ color: "black", margin: "0 0 0.5rem" }}>{character.name}</h2>
      <p style={{ color: "#666", margin: 0 }}>{character.source}</p>
      <div style={{ marginTop: "1rem" }}>
        <strong>ELO: {character.elo}</strong>
        <br />
        Record: {character.wins}W - {character.losses}L
      </div>
    </div>
  );
}
