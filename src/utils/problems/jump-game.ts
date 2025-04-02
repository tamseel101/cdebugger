import assert from "assert";
import { Problem } from "../types/problem";

const starterCodeJumpGame = `bool canJump(int* nums, int numsSize) {
  // Write your code here
};`;

const JUDGE0_URL = "https://cdebugger.utm.utoronto.ca/"; // Local Judge0 instance

async function handlerJumpGame(userSourceCode: string) {
    // Define test cases
    const testCases = [
        { nums: [2, 3, 1, 1, 4], expected: true },
        { nums: [3, 2, 1, 0, 4], expected: false },
        { nums: [2, 0, 0], expected: true },
        { nums: [2, 5, 0, 0], expected: true }
    ];

    let results = {
        allPassed: true,
        testCaseResults: [] as Array<{ 
            input: { nums: number[] }; 
            expected: boolean;
            actual?: string;
            error?: string;
            passed: boolean;
        }>,
        compilationError: "",
        runtimeError: ""
    };

    // Iterate over each test case
    for (const { nums, expected } of testCases) {
        // add include statements
        const includeStatements = `
            #include <stdio.h>
            #include <stdbool.h>
            #include <stdlib.h>
        `;
        // Create the main function to test the user's code
        const mainFunction = `
            #include <stdio.h>
            #include <stdbool.h>

            bool canJump(int* nums, int numsSize);

            int main() {
                int nums[] = {${nums.join(', ')}};
                int numsSize = sizeof(nums) / sizeof(nums[0]);
                bool result = canJump(nums, numsSize);
                printf(result ? "true" : "false");
                return 0;
            }
        `;

        // Combine the user's code with the main function
        const completeSourceCode = `${includeStatements}\n${userSourceCode}\n${mainFunction}`;
        console.log(completeSourceCode);
        // Prepare the payload for the Judge0 API
        const payload = {
            source_code: completeSourceCode,
            language_id: 50, // Language ID for C (GCC)
            stdin: "", // No input needed as the main function defines the inputs
            expected_output: expected ? "true" : "false", // Expected output as a string
        };

        try {
            // Step 1: Create a new submission
            const submissionResponse = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!submissionResponse.ok) {
                throw new Error(`Error: ${submissionResponse.status} ${submissionResponse.statusText}`);
            }

            const submissionData = await submissionResponse.json();
            const token = submissionData.token;

            // Step 2: Poll for the result
            let result;
            while (true) {
                const resultResponse = await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false`);
                result = await resultResponse.json();
                if (result.status.id >= 3) {
                    break; // Status 3 indicates that the execution is complete
                }

                await new Promise(res => setTimeout(res, 1000)); // Wait for 1 second before polling again
            }

            // Step 3: Handle execution result
            const testCaseResult: any = {
                input: { nums },
                expected,
                passed: false,
            };

            if (result.stdout) {
                testCaseResult.actual = result.stdout.trim();
                testCaseResult.passed = testCaseResult.actual === (expected ? "true" : "false");
            }

            if (result.compile_output) {
                results.compilationError = result.compile_output;
            }

            if (result.stderr) {
                results.runtimeError = result.stderr;
            }

            if (!testCaseResult.passed) {
                results.allPassed = false;
            }

            results.testCaseResults.push(testCaseResult);
        } catch (error) {
            results.allPassed = false;
            results.testCaseResults.push({
                input: { nums },
                expected,
                error: error instanceof Error ? error.message : String(error),
                passed: false,
            });
        }
    }
    console.log(results);
    return results;
}

// Problem description
export const jumpGame: Problem = {
	id: "jump-game",
	title: "3. Jump Game",
	problemStatement: `<p class='mt-3'>
        You are given an integer array <code>nums</code>. You are initially positioned at the <strong>first index</strong>
        and each element in the array represents your maximum jump length at that position.
      </p>
        <p class='mt-3'>
        Return <code>true</code> if you can reach the last index, or <code>false</code> otherwise.
        </p>
      `,

	examples: [
		{
			id: 0,
			inputText: `nums = [2,3,1,1,4]`,
			outputText: `true`,
			explanation: "Jump 1 step from index 0 to 1, then 3 steps to the last index.",
		},
		{
			id: 1,
			inputText: `nums = [3,2,1,0,4]`,
			outputText: `false`,
			explanation:
				"You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.",
		},
	],
	constraints: `<li class='mt-2'><code>1 <= nums.length <= 10^4</code></li>
        <li class='mt-2'><code>0 <= nums[i] <= 10^5</code></li>`,
	starterCode: starterCodeJumpGame,
	handlerFunction: handlerJumpGame,
	starterFunctionName: "function canJump(",
	order: 3,
};
