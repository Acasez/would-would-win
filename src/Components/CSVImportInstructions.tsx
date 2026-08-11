export default function CSVImportInstructions() {
  return (
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
          Make a sheet in Google Sheets (or a similar tool) with a list of
          characters.
        </li>
        <li>
          The sheet should have the tabs <code>ID</code>, <code>Name</code>,{" "}
          <code>Source</code> in that order.
        </li>
        <li>Download the sheet as Comma-separated values (.csv) file</li>
        <li>
          Click <strong>📥 Import CSV</strong> button above and select the
          downloaded file
        </li>
        <li>
          New characters are added with ELO 1000; existing IDs keep their stats
        </li>
      </ol>
    </div>
  );
}
