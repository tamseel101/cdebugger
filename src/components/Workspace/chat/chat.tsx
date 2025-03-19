import React, { useState, useEffect } from "react";
import OpenAI from "openai";
import { problems } from "@/utils/problems"; // Import problems from the problems file
import { useRouter } from "next/router";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Use environment variable for security
  dangerouslyAllowBrowser: true,
});

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [userInput, setUserInput] = useState("");

  const router = useRouter();
  const { pid } = router.query; // Get the problem ID from the URL
  const problem = problems[pid as string]; // Retrieve problem details
  const [userCode, setUserCode] = useState<string>(""); // Store user code
  const [failedTestCases, setFailedTestCases] = useState<string>(""); // Store failed test cases

  useEffect(() => {
    if (pid) {
      const storedCode = localStorage.getItem(`code-${pid}`);
      setUserCode(storedCode ? JSON.parse(storedCode) : problem?.starterCode || "");
    }
  }, [pid]);

  useEffect(() => {
    if (pid) {
      const storedTestResults = JSON.parse(localStorage.getItem(`testCaseResults-${pid}`) || "[]");
      console.log("Stored Test Results:", storedTestResults);

      if (storedTestResults.length === 0) {
        console.log("No test results found.");
      }

      const failedCases = storedTestResults
        .filter((test: any) => test.passed === false) // Ensure only failed cases are selected
        .map((test: any, index: number) =>
          `Test Case ${index + 1} Failed\nInput: ${JSON.stringify(test.input)}\nExpected: ${JSON.stringify(test.expected)}\nGot: ${test.actual || "Error"}`
        )
        .join("\n\n");

      setFailedTestCases(failedCases || "Unable to get failed test cases.");
    }
  }, [pid]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessage = { sender: "User", message: userInput };
    setMessages([...messages, newMessage]);
    setUserInput("");

    // 🔴 Fetch the most updated user code from local storage
    const latestUserCode = localStorage.getItem(`code-${pid}`);
    setUserCode(latestUserCode ? JSON.parse(latestUserCode) : problem?.starterCode || "");

    // Format problem description
    const problemDescription = problem
      ? `Problem Title: ${problem.title}\n\nDescription: ${problem.problemStatement.replace(/<[^>]+>/g, '')}\n`
      : "No problem found.";

    // Format test cases
    const testCases = problem?.examples
      ? problem.examples.map((example, index) => `Test Case ${index + 1}:\nInput: ${example.inputText}\nExpected Output: ${example.outputText}`)
          .join("\n\n")
      : "No test cases found.";

    // Combine everything into one string (AI will see this but user won't)
    const combinedInfo = `${problemDescription}\n\n${testCases}\n\n${failedTestCases ? "Failed Test Cases:\n" + failedTestCases : "could not get F cases."}\n\nUser's Code:\n${latestUserCode}`;
    console.log("=== Combined Info ===\n", combinedInfo);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 200, // Limits response to a very short question (1 line)
        temperature: 0.3, // Keeps responses more deterministic & precise
        messages: [
          {
            role: "system",
            content: `You are a Socratic AI designed to help users debug their code by guiding them through structured inquiry.
            keep reponses brief and to the point (just ask a single question each time).
            Your goal is NOT to provide the answer directly. Instead, you will:
            - Ask goal-oriented questions that help users articulate their intended behavior. 
            - Ask procedure-oriented questions that make users analyze their own code logic.
            - Encourage hypothesis testing by prompting users to consider multiple explanations for a bug.
            - Adapt your questioning style based on the user's responses, maintaining an appropriate level of challenge.
            - Prompt the user to describe their debugging steps before suggesting changes.
            
            Example Approach:
            - If a user states that their function is returning incorrect results, first ask them: 
              "What output were you expecting, and what did you get instead?"
            - If they struggle to identify a specific issue, ask:
              "Can you walk through your code, line by line, and explain what each line does?"
            - If a logical error is suspected, avoid saying ‘Line X is wrong’; instead, ask:
              "What does this line of code do in practice? How does that compare to what you intended?"

            The user is working on the following coding problem:
            ${combinedInfo}`
          },
          ...messages.map((m) => ({ role: m.sender === "User" ? "user" : "assistant", content: m.message })),
          { role: "user", content: userInput },
        ],
      });

      const botMessage = {
        sender: "Assistant",
        message: response.choices[0]?.message?.content || "No response from the AI.",
      };

      setMessages([...messages, newMessage, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages([...messages, newMessage, { sender: "Assistant", message: "Failed to fetch response." }]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault(); // Prevents default form submission behavior
      handleSendMessage();
    }
  };


  const saveConversationToJournal = () => {
    const existingJournals = JSON.parse(localStorage.getItem("journals") || "[]");
  
    const journalEntry = {
      problemId: pid,
      problemTitle: problem?.title || "Unknown",
      description: problem?.problemStatement.replace(/<[^>]+>/g, "") || "",
      userCode,
      failedTestCases,
      conversation: messages,
      timestamp: new Date().toISOString(),
    };
  
    localStorage.setItem("journals", JSON.stringify([...existingJournals, journalEntry]));
  
    console.log("Conversation saved successfully!", journalEntry);
  
    // 🔴 Open journal page in new tab
    window.open('/journal', '_blank');
  };
  

  const handleEndConversation = () => {
    const confirmSave = confirm("Would you like to save this conversation to your journal?");
    if (confirmSave) {
      // Prompt the user to add any notes for the journal entry
      const userNotes = prompt("Add any notes for this journal entry (optional):");
  
      const existingJournals = JSON.parse(localStorage.getItem("journals") || "[]");
      const journalEntry = {
        problemId: pid,
        problemTitle: problem?.title || "Unknown",
        description: problem?.problemStatement.replace(/<[^>]+>/g, "") || "",
        userCode,
        failedTestCases,
        conversation: messages,
        timestamp: new Date().toISOString(),
        notes: userNotes || "", // Save the notes provided by the user
      };
  
      existingJournals.push(journalEntry);
      localStorage.setItem("journals", JSON.stringify(existingJournals));
      alert("✅ Conversation saved successfully!");
  
      // Open the journal page in a new tab
      window.open("/journal", "_blank");
    }
  };
  
  

  const chatContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#2c2c2c",
    padding: "10px",
    overflowY: "auto",
    borderLeft: "1px solid #444", // Adds a subtle divider
  };
  
  const chatMessagesStyle: React.CSSProperties = {
    flexGrow: 1, // Allows messages to take full available space
    overflowY: "auto",
    paddingBottom: "10px",
  };
  
  const chatMessageStyle: React.CSSProperties = {
    marginBottom: "10px",
    padding: "10px",
    borderRadius: "5px",
    maxWidth: "80%",
    wordWrap: "break-word",
    fontSize: "14px",
    lineHeight: "1.5",
  };
  
  const userMessageStyle: React.CSSProperties = {
    ...chatMessageStyle,
    backgroundColor: "#d1e7dd",
    alignSelf: "flex-end",
    textAlign: "right",
  };
  
  const assistantMessageStyle: React.CSSProperties = {
    ...chatMessageStyle,
    backgroundColor: "#f8d7da",
    alignSelf: "flex-start",
    textAlign: "left",
  };
  
  const chatInputContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    backgroundColor: "#1c1c1c",
    borderTop: "1px solid #444", // Adds separation
  };
  
  const chatInputStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #666",
    backgroundColor: "#333",
    color: "white",
    fontSize: "14px",
  };
  
  const buttonStyle: React.CSSProperties = {
    marginLeft: "10px",
    padding: "10px",
    borderRadius: "5px",
    fontSize: "14px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s",
  };
  
  const sendButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#ff6600",
    color: "white",
  };
  
  const saveButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#6c757d",
    color: "white",
  };
  

  return (
    <div className='bg-dark-fill-3 chat-container' style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className='chat-messages' style={chatContainerStyle}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.sender === "User" ? userMessageStyle : assistantMessageStyle}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", padding: "10px", backgroundColor: "#1c1c1c" }}>
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}  // 🔴 Added this line
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "none" }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            marginLeft: "10px",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#ff6600",  // 🔴 Changed button color
            color: "white",
            border: "none",
            cursor: "pointer"
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e65c00")}  // 🔴 Added hover effect
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#ff6600")}  // 🔴 Added hover effect
        >
          Send
        </button>

        <button
          onClick={() => handleEndConversation()}
          style={{
            marginLeft: "10px",
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Save Chat
        </button>
      </div>
    </div>
  );
};

export default Chat;