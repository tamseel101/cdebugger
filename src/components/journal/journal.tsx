import React, { useEffect, useState } from "react";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import Topbar from "@/components/Topbar/Topbar"; // ✅ Import Navbar (or use Navbar if applicable)

type JournalEntry = {
  problemId: string;
  problemTitle: string;
  description: string;
  userCode: string;
  failedTestCases: string;
  conversation: { sender: string; message: string }[];
  timestamp: string;
  notes: string;
};

const Journal: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  useEffect(() => {
    const storedJournals = JSON.parse(localStorage.getItem("journals") || "[]");
    storedJournals.sort(
      (a: JournalEntry, b: JournalEntry) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    setJournalEntries(storedJournals);
  }, []);

  // ✅ Export to CSV including notes
  const exportToCSV = () => {
    const csvRows = [];
    const headers = [
      "Problem ID",
      "Problem Title",
      "Description",
      "User Code",
      "Failed Test Cases",
      "Timestamp",
      "Conversation",
      "Notes",
    ];
    csvRows.push(headers.join(","));

    journalEntries.forEach((entry) => {
      const conversationText = entry.conversation
        .map((msg) => `${msg.sender}: ${msg.message.replace(/,/g, " ")}`)
        .join(" ");
      csvRows.push(
        [
          entry.problemId,
          `"${entry.problemTitle}"`,
          `"${entry.description.replace(/"/g, '""')}"`,
          `"${entry.userCode.replace(/"/g, '""')}"`,
          `"${entry.failedTestCases.replace(/"/g, '""')}"`,
          entry.timestamp,
          `"${conversationText.replace(/"/g, '""')}"`,
          `"${entry.notes.replace(/"/g, '""')}"`,
        ].join(",")
      );
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    saveAs(blob, "debugging_journal.csv");
  };

  // ✅ Export to Excel including notes
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      journalEntries.map((entry) => ({
        "Problem ID": entry.problemId,
        "Problem Title": entry.problemTitle,
        "Description": entry.description,
        "User Code": entry.userCode,
        "Failed Test Cases": entry.failedTestCases,
        "Timestamp": entry.timestamp,
        "Conversation": entry.conversation
          .map((msg) => `${msg.sender}: ${msg.message}`)
          .join("\n"),
        "Notes": entry.notes,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Journal Entries");
    XLSX.writeFile(workbook, "debugging_journal.xlsx");
  };

  // ✅ Allow users to edit notes
  const handleEditNotes = (entryIndex: number) => {
    const currentNotes = journalEntries[entryIndex].notes;
    const updatedNotes = prompt("Edit your notes:", currentNotes);
    if (updatedNotes !== null) {
      const updatedEntries = [...journalEntries];
      updatedEntries[entryIndex].notes = updatedNotes;
      setJournalEntries(updatedEntries);
      localStorage.setItem("journals", JSON.stringify(updatedEntries));
    }
  };

  return (
    <div>
      {/* ✅ Add Navbar */}
      <Topbar />

      <div style={{ padding: "20px", color: "#333" }}>
        <h1>My Debugging Journal 📓</h1>

        {journalEntries.length === 0 ? (
          <p>No journal entries yet.</p>
        ) : (
          <>
            <div style={{ marginBottom: "10px" }}>
              <button
                onClick={exportToExcel}
                style={{
                  padding: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginRight: "10px",
                }}
              >
                📊 Export as Excel
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  padding: "10px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                📄 Export as CSV
              </button>
            </div>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "#FFFAF0",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#6c757d", color: "white" }}>
                  <th style={tableHeaderStyle}>Problem ID</th>
                  <th style={tableHeaderStyle}>Problem Title</th>
                  <th style={tableHeaderStyle}>Description</th>
                  <th style={tableHeaderStyle}>User Code</th>
                  <th style={tableHeaderStyle}>Failed Test Cases</th>
                  <th style={tableHeaderStyle}>Timestamp</th>
                  <th style={tableHeaderStyle}>Conversation</th>
                  <th style={tableHeaderStyle}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {journalEntries.map((entry, index) => (
                  <tr
                    key={index}
                    style={index % 2 === 0 ? { backgroundColor: "#7FFFD4" } : {}}
                  >
                    <td style={tableCellStyle}>{entry.problemId}</td>
                    <td style={tableCellStyle}>{entry.problemTitle}</td>
                    <td style={tableCellStyle}>{entry.description}</td>
                    <td
                      style={{
                        ...tableCellStyle,
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                      }}
                    >
                      <pre>{entry.userCode}</pre>
                    </td>
                    <td style={tableCellStyle}>{entry.failedTestCases}</td>
                    <td style={tableCellStyle}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>
                      {entry.conversation.map((msg, idx) => (
                        <div key={idx}>
                          <strong>{msg.sender}:</strong> {msg.message}
                        </div>
                      ))}
                    </td>
                    <td style={tableCellStyle}>
                      {entry.notes}
                      <button
                        onClick={() => handleEditNotes(index)}
                        style={{ marginLeft: "10px", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

// ✅ Table styling
const tableHeaderStyle: React.CSSProperties = {
  padding: "10px",
  borderBottom: "2px solid #ccc",
  textAlign: "left",
};

const tableCellStyle: React.CSSProperties = {
  padding: "5px",
  borderBottom: "1px solid #ddd",
};

export default Journal;
