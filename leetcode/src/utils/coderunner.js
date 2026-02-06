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

    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language: languageMap[language],
        version: "*",        // required by Piston API
        files: [
          {
            name: "solution",
            content: code
          }
        ],
        stdin: input
      }
    );

    return {
      output: response.data.run.output || "",
      error: response.data.run.stderr || null
    };
  } catch (err) {
    console.log("PISTON ERROR ", err.response?.data || err.message);
    return { error: "execution failed" };
  }
};

module.exports = runCode;
