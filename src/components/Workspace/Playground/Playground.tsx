import { useState, useEffect } from "react";
import PreferenceNav from "./PreferenceNav/PreferenceNav";
import Split from "react-split";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { javascript } from "@codemirror/lang-javascript";
import EditorFooter from "./EditorFooter";
import { Problem } from "@/utils/types/problem";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/firebase/firebase";
import { toast } from "react-toastify";
import { problems } from "@/utils/problems";
import { useRouter } from "next/router";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import useLocalStorage from "@/hooks/useLocalStorage";

type PlaygroundProps = {
	problem: Problem;
	setSuccess: React.Dispatch<React.SetStateAction<boolean>>;
	setSolved: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface ISettings {
	fontSize: string;
	settingsModalIsOpen: boolean;
	dropdownIsOpen: boolean;
}

const Playground: React.FC<PlaygroundProps> = ({ problem, setSuccess, setSolved }) => {
	const [activeTestCaseId, setActiveTestCaseId] = useState<number>(0);
	let [userCode, setUserCode] = useState<string>(problem.starterCode);

	const [fontSize, setFontSize] = useLocalStorage("lcc-fontSize", "16px");

	const [settings, setSettings] = useState<ISettings>({
		fontSize: fontSize,
		settingsModalIsOpen: false,
		dropdownIsOpen: false,
	});

	const [user] = useAuthState(auth);
	const {
		query: { pid },
	} = useRouter();

	const [testResults, setTestResults] = useState<Array<{ 
		input: { nums: number[]; target: number }; expected: number[]; 
		actual?: string; 
		error?: string; 
		passed: boolean 
	}>>([]);
	const [compilationError, setCompilationError] = useState<string | null>(null);
	const [runtimeError, setRuntimeError] = useState<string | null>(null);


	const handleSubmit = async () => {
		if (!user) {
			toast.error("Please login to submit your code", {
				position: "top-center",
				autoClose: 3000,
				theme: "dark",
			});
			return;
		}
	
		try {
			console.log(userCode);
			const handler = problems[pid as string].handlerFunction;
	
			if (typeof handler === "function") {
				const results = await handler(userCode); // Get detailed test case results
				console.log("Handler Results:", results);
	
				// Store test results
				setTestResults(results.testCaseResults);
				console.log("Test Results:", results.testCaseResults);
				setCompilationError(results.compilationError || null);
				setRuntimeError(results.runtimeError || null);

				localStorage.setItem(`testResults-${pid}`, JSON.stringify(results.testCaseResults));
	
				if (results.allPassed) {
					toast.success("Congrats! All tests passed!", {
						position: "top-center",
						autoClose: 3000,
						theme: "dark",
					});
	
					setSuccess(true);
					setTimeout(() => setSuccess(false), 4000);
	
					const userRef = doc(firestore, "users", user.uid);
					await updateDoc(userRef, {
						solvedProblems: arrayUnion(pid),
					});
	
					setSolved(true);
				} else {
					toast.error("Some test cases failed!", {
						position: "top-center",
						autoClose: 3000,
						theme: "dark",
					});
	
					if (results.compilationError) {
						toast.error("Compilation Error: " + results.compilationError, {
							position: "top-center",
							autoClose: 5000,
							theme: "dark",
						});
					}
	
					if (results.runtimeError) {
						toast.error("Runtime Error: " + results.runtimeError, {
							position: "top-center",
							autoClose: 5000,
							theme: "dark",
						});
					}
				}
			}
		} catch (error: any) {
			console.log(error.message);
			toast.error(error.message, {
				position: "top-center",
				autoClose: 3000,
				theme: "dark",
			});
		}
	};
	

	useEffect(() => {
		const code = localStorage.getItem(`code-${pid}`);
		if (user) {
			setUserCode(code ? JSON.parse(code) : problem.starterCode);
		} else {
			setUserCode(problem.starterCode);
		}
	}, [pid, user, problem.starterCode]);

	const onChange = (value: string) => {
		setUserCode(value);
		localStorage.setItem(`code-${pid}`, JSON.stringify(value));
	};

	return (
		<div className='flex flex-col bg-dark-layer-1 relative overflow-x-hidden'>
			<PreferenceNav settings={settings} setSettings={setSettings} />

			<Split className='h-[calc(100vh-94px)]' direction='vertical' sizes={[60, 40]} minSize={60}>
				<div className='w-full overflow-auto'>
					<CodeMirror
						value={userCode}
						theme={vscodeDark}
						onChange={onChange}
						extensions={[javascript()]}
						style={{ fontSize: settings.fontSize }}
					/>
				</div>
				<div className='w-full px-5 overflow-auto'>
					{/* testcase heading */}
					<div className='flex h-10 items-center space-x-6'>
						<div className='relative flex h-full flex-col justify-center cursor-pointer'>
							<div className='text-sm font-medium leading-5 text-white'>Testcases</div>
							<hr className='absolute bottom-0 h-0.5 w-full rounded-full border-none bg-white' />
						</div>
					</div>

					{/* Testcase Buttons */}
					<div className="flex">
						{problem.examples.map((example, index) => {
							const testCaseResult = testResults[index]; // Get result for this test case
							const isPassed = testCaseResult?.passed;

							return (
								<div
									className="mr-2 items-start mt-2"
									key={example.id}
									onClick={() => setActiveTestCaseId(index)} // Clicking selects the test case
								>
									<div
										className={`font-medium items-center transition-all focus:outline-none inline-flex relative rounded-lg px-4 py-1 cursor-pointer whitespace-nowrap
											${activeTestCaseId === index ? "text-white bg-blue-500" : "text-gray-500 bg-dark-fill-3"}
											${testCaseResult ? (isPassed ? "border-green-500 bg-green-900" : "border-red-500 bg-red-900") : ""}
										`}
									>
										Case {index + 1} {testCaseResult && (isPassed ? "✅" : "❌")}
									</div>
								</div>
							);
						})}
					</div>


					<div className="font-semibold my-4">
						<p className="text-sm font-medium mt-4 text-white">Input:</p>
						<div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2">
							{problem.examples[activeTestCaseId].inputText}
						</div>

						<p className="text-sm font-medium mt-4 text-white">Expected Output:</p>
						<div className="w-full cursor-text rounded-lg border px-3 py-[10px] bg-dark-fill-3 border-transparent text-white mt-2">
							{problem.examples[activeTestCaseId].outputText}
						</div>

						{/* Show Actual Output and Test Result */}
						{testResults.length > 0 && testResults[activeTestCaseId] && (
							<>
								<p className="text-sm font-medium mt-4 text-white">Actual Output:</p>
								<div className={`w-full cursor-text rounded-lg border px-3 py-[10px] mt-2
									${testResults[activeTestCaseId].passed ? "border-green-500 bg-green-900" : "border-red-500 bg-red-900"}
								`}>
									{testResults[activeTestCaseId].actual || "Error Occurred"}
								</div>

								{!testResults[activeTestCaseId].passed && (
									<p className="text-red-400">❌ Test Failed</p>
								)}
							</>
						)}

						{/* Show Errors if they exist */}
						{testResults[activeTestCaseId]?.error && (
							<div className="mt-3 p-3 rounded-lg border border-orange-500 bg-orange-900">
								<p className="text-orange-400">⚠ Error:</p>
								<pre className="text-white">{testResults[activeTestCaseId].error}</pre>
							</div>
						)}
					</div>

				</div>
			</Split>
			<EditorFooter handleSubmit={handleSubmit} />
		</div>
	);
};
export default Playground;
