import { useState } from "react";
import Split from "react-split";
import ProblemDescription from "./ProblemDescription/ProblemDescription";
import Playground from "./Playground/Playground";
import Chat from "./chat/chat";
import { Problem } from "@/utils/types/problem";

const Workspace = ({ problem }) => {
    const [success, setSuccess] = useState(false);
    const [solved, setSolved] = useState(false);

    return (
        <div style={styles.workspaceContainer}>
            <Split
                className="split"
                sizes={[25, 50, 25]} // Divide into 3 sections (25% - 50% - 25%)
                minSize={100}
                gutterSize={5}
                style={styles.splitContainer}
            >
                <ProblemDescription problem={problem} _solved={solved} />
                <div style={styles.playgroundContainer}>
                    <Playground problem={problem} setSuccess={setSuccess} setSolved={setSolved} />
                </div>
                <Chat />
            </Split>
        </div>
    );
};

const styles = {
    workspaceContainer: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
    },
    splitContainer: {
        display: "flex",
        height: "100%",
    },
    playgroundContainer: {
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1c1c1c",
    },
};

export default Workspace;
