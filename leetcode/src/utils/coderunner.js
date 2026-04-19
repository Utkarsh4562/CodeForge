const axios = require("axios");

// mapping user input → Piston API language
const languageMap = {
  python: "python3",
  cpp: "cpp",
  "c++": "cpp",       // user may send c++
  c: "c",
  java: "java",
  javascript: "javascript"
};

const runCode = async (code, language, input = "") => {
  try {
    language = language.toLowerCase();
    const mappedLanguage = languageMap[language];

    if (!mappedLanguage) {
      return { error: `Unsupported language: ${language}` };
    }

    // For JavaScript, we need to provide a wrapper to read from stdin
    let finalCode = code;
    if (language === "javascript") {
      // Check if code already has readline setup
      if (!code.includes("readline")) {
        // Wrap the code to handle stdin input properly
        finalCode = `
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

let inputLines = [];
rl.on('line', (line) => {
  inputLines.push(line);
});

rl.on('close', () => {
  ${code}
});
`;
      }
    }

    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: mappedLanguage,
        version: "*",        // required by Piston API
        files: [
          {
            name: "solution",
            content: finalCode
          }
        ],
        stdin: input,
        timeout: 10 // 10 second timeout
      },
      {
        timeout: 15000 // 15 second axios timeout
      }
    );

    // Extract output, handling both stdout and stderr
    const output = response.data.run.stdout || response.data.run.output || "";
    const error = response.data.run.stderr;

    // If there's stderr but also stdout, it might be a warning, not an error
    // Only treat as error if there's no stdout
    if (error && !output) {
      return {
        output: "",
        error: error
      };
    }

    return {
      output: output,
      error: error ? error : null
    };
  } catch (err) {
    console.log("PISTON ERROR:", err.response?.data || err.message);
    return { 
      error: err.response?.data?.message || err.message || "Execution failed"
    };
  }
};

module.exports = runCode;
