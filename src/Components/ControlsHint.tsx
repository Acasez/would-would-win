export default function ControlsHint() {
  const controlsHint = (key: string, label: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        padding: "0.2rem 0.5rem",
        backgroundColor: "#eee",
        borderRadius: "4px",
        fontSize: "0.8rem",
        color: "#555",
      }}
    >
      <kbd style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{key}</kbd>
      <span>{label}</span>
    </span>
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        justifyContent: "center",
        marginBottom: "1.5rem",
        flexWrap: "wrap",
      }}
    >
      {controlsHint("←", "Vote Left")}
      {controlsHint("→", "Vote Right")}
      {controlsHint("↑", "Undo")}
      {controlsHint("↓", "Skip")}
    </div>
  );
}
