import assert from "assert";
import { Problem } from "../types/problem";

const starterCodeTwoSum = `function twoSum(nums,target){
  // Write your code here
};`;

// const JUDGE0_URL = "http://127.0.0.1:2358"; // Local Judge0 instance
const JUDGE0_URL = "https://cdebugger.utm.utoronto.ca/"; // Local Judge0 instance

async function handlerTwoSum(userSourceCode: string) {
    // Define test cases
    const testCases = [
        { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
        { nums: [3, 2, 4], target: 6, expected: [1, 2] },
        { nums: [3, 3], target: 6, expected: [0, 1] }
    ];

    let results = {
        allPassed: true,
        testCaseResults: [] as Array<{ 
            input: { nums: number[]; target: number }; 
            expected: number[];
            actual?: string;
            error?: string;
            passed: boolean;
        }>,
        compilationError: "",
        runtimeError: ""
    };

    // Iterate over each test case
    for (const { nums, target, expected } of testCases) {
        // Create the main function to test the user's code
        const mainFunction = `
            #include <stdio.h>
            #include <stdlib.h>

            int* twoSum(int* nums, int numsSize, int target, int* returnSize);

            int main() {
                int nums[] = {${nums.join(', ')}};
                int target = ${target};
                int numsSize = sizeof(nums) / sizeof(nums[0]);
                int returnSize;
                int* result = twoSum(nums, numsSize, target, &returnSize);

                if (result != NULL && returnSize == 2) {
                    printf("[%d, %d]", result[0], result[1]);
                    free(result);
                } else {
                    printf("NULL");
                }
                return 0;

            }
        `;

        // Combine the user's code with the main function
        const completeSourceCode = `${userSourceCode}\n${mainFunction}`;

        // Prepare the payload for the Judge0 API
        const payload = {
            source_code: completeSourceCode,
            language_id: 50, // Language ID for C (GCC)
            stdin: "", // No input needed as the main function defines the inputs
            expected_output: expected.join(' ') + ' ', // Expected output as a string
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
                    // The `result.status.id` gets updated through the polling mechanism that checks 
                    // the status of the code execution on the Judge0 API. 
                    // The Judge0 API uses status IDs to indicate the state of the submission. 
                    // Here are some common status IDs:
                    //  - **1**: In Queue - 
                    // **2**: Processing - 
                    // **3**: Accepted (Execution Complete) - 
                    // **4**: Wrong Answer - 
                    // **5**: Time Limit Exceeded - **
                    // 6**: Compilation Error - 
                    // **7**: Runtime Error (SIGSEGV, SIGXFSZ, etc.) - 
                    // **8**: Internal Error
                }

                await new Promise(res => setTimeout(res, 1000)); // Wait for 1 second before polling again
            }

            // Step 3: // Handle execution result
             const testCaseResult: any = {
                input: { nums, target },
                expected,
                passed: false,
            };

            if (result.stdout) {
                testCaseResult.actual = result.stdout.trim();
                try {
                    const actualOutputArray = JSON.parse(testCaseResult.actual);
                    testCaseResult.passed = JSON.stringify(actualOutputArray) === JSON.stringify(expected);
                } catch (e) {
                    testCaseResult.passed = false;
                }
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
                input: { nums, target },
                expected,
                error: error instanceof Error ? error.message : String(error),
                passed: false,
            });
        }
    }
    console.log(results);
    return results;
}

// description
export const twoSum: Problem = {
	id: "two-sum",
	title: "1. Two Sum",
	problemStatement: `<p class='mt-3'>
        Given an array of integers <code>nums</code> and an integer <code>target</code>, return
        <em>indices of the two numbers such that they add up to</em> <code>target</code>.
            </p>
            <p class='mt-3'>
            You may assume that each input would have <strong>exactly one solution</strong>, and you
            may not use thesame element twice.
            </p>
            <p class='mt-3'>You can return the answer in any order.</p>`,
	examples: [
		{
			id: 1,
			inputText: "nums = [2,7,11,15], target = 9",
			outputText: "[0,1]",
			explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
		},
		{
			id: 2,
			inputText: "nums = [3,2,4], target = 6",
			outputText: "[1,2]",
			explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
		},
		{
			id: 3,
			inputText: " nums = [3,3], target = 6",
			outputText: "[0,1]",
		},
	],
	constraints: `<li class='mt-2'>
        <code>2 ≤ nums.length ≤ 10</code>
        </li> <li class='mt-2'>
        <code>-10 ≤ nums[i] ≤ 10</code>
        </li> <li class='mt-2'>
        <code>-10 ≤ target ≤ 10</code>
        </li>
        <li class='mt-2 text-sm'>
        <strong>Only one valid answer exists.</strong>
        </li>`,
	handlerFunction: handlerTwoSum,
	starterCode: starterCodeTwoSum,
	order: 1,
	starterFunctionName: "function twoSum(",
};
