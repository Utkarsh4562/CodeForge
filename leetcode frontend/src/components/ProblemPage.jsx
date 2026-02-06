import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from "../utils/axiosClient";
import ChatAi from "../components/chatAi";
import Editor from '@monaco-editor/react';
import Editorial from '../components/Editorial';

// Language options
const languages = [
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'python', label: 'Python 3' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' }
];

// Get default code template
const getDefaultCode = (lang) => {
  const defaults = {
    javascript: `// Write your JavaScript solution here
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('', (input) => {
    // Your solution here
    console.log(input);
    rl.close();
});`,
    python: `# Write your Python solution here
import sys

def main():
    # Read input
    data = sys.stdin.read().strip()
    
    // Your solution here
    print(data)

if __name__ == "__main__":
    main()`,
    cpp: `// Write your C++ solution here
#include <iostream>
using namespace std;

int main() {
  int a, b;
  // Your solution here
  cout << input << endl;
  return 0;
}`,
    java: `// Write your Java solution here
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();
        
        // Your solution here
        System.out.println(input);
        
        sc.close();
    }
}`
  };
  
  return defaults[lang] || defaults.javascript;
};

// Language Selector Component
const LanguageSelector = ({ language, onLanguageChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-400">Language:</span>
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Problem Description Component - UPDATED for schema
const ProblemDescription = ({ problem }) => {
  const [copiedStartCode, setCopiedStartCode] = useState(false);
  const [copiedConstraints, setCopiedConstraints] = useState(false);

  if (!problem) return null;

  // Format visibleTestCases from schema
  const renderTestCases = () => {
    if (!problem.visibleTestCases || !Array.isArray(problem.visibleTestCases) || problem.visibleTestCases.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-2">Examples</h2>
        {problem.visibleTestCases.map((testCase, index) => (
          <div key={index} className="bg-gray-800 rounded-lg p-4">
            <div className="mb-2">
              <span className="font-medium text-gray-400">Example {index + 1}:</span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Input: </span>
                <code className="ml-2 bg-gray-900 px-2 py-1 rounded font-mono">
                  {testCase.input}
                </code>
              </div>
              <div>
                <span className="text-gray-400">Output: </span>
                <code className="ml-2 bg-gray-900 px-2 py-1 rounded font-mono">
                  {testCase.output}
                </code>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Get start code for current language
  const getStartCodeForDisplay = (lang = 'javascript') => {
    if (!problem.startCode || !Array.isArray(problem.startCode)) {
      return getDefaultCode(lang);
    }
    
    const codeObj = problem.startCode.find(item => item.language === lang);
    return codeObj ? codeObj.initialCode : getDefaultCode(lang);
  };

  // Get reference solution for current language
  const getReferenceSolution = (lang = 'javascript') => {
    if (!problem.refrenceSolution || !Array.isArray(problem.refrenceSolution)) {
      return null;
    }
    
    const solution = problem.refrenceSolution.find(item => item.language === lang);
    return solution ? solution.completeCode : null;
  };

  // Render tags
  const renderTags = () => {
    if (!problem.tags || !Array.isArray(problem.tags)) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {problem.tags.map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const handleCopyStartCode = () => {
    const startCode = getStartCodeForDisplay('javascript');
    navigator.clipboard.writeText(startCode)
      .then(() => {
        setCopiedStartCode(true);
        setTimeout(() => setCopiedStartCode(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  const handleCopyConstraints = () => {
    navigator.clipboard.writeText(problem.constraints)
      .then(() => {
        setCopiedConstraints(true);
        setTimeout(() => setCopiedConstraints(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy constraints: ', err);
      });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Description</h2>
        <p className="text-gray-300 whitespace-pre-line">
          {problem.description || "No description available."}
        </p>
        {renderTags()}
      </div>
      
      {renderTestCases()}
      
      {problem.constraints && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Constraints</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="text-gray-300 whitespace-pre-wrap">{problem.constraints}</pre>
            <button
              onClick={handleCopyConstraints}
              className={`mt-2 px-3 py-1 text-sm rounded ${
                copiedConstraints 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {copiedConstraints ? '✓ Copied!' : 'Copy Constraints'}
            </button>
          </div>
        </div>
      )}
      
      {/* Start Code Section */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Start Code</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-300">JavaScript</span>
            <button 
              onClick={handleCopyStartCode}
              className={`text-sm px-3 py-1 rounded ${
                copiedStartCode
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {copiedStartCode ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto text-gray-300">
            {getStartCodeForDisplay('javascript')}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Chat AI Modal Component - FIXED: Pass correct data
const ChatAiModal = ({ isOpen, onClose, problem }) => {
  if (!isOpen) return null;

  // Prepare problem data for ChatAi component based on schema
  const getChatProblemData = () => {
    if (!problem) return {};
    
    // Get start code (first language's initial code or default)
    let startCode = '';
    if (problem.startCode && Array.isArray(problem.startCode) && problem.startCode.length > 0) {
      startCode = problem.startCode[0].initialCode;
    } else {
      startCode = getDefaultCode('javascript');
    }
    
    // Format test cases as string for ChatAi
    let testCases = '';
    if (problem.visibleTestCases && Array.isArray(problem.visibleTestCases)) {
      testCases = problem.visibleTestCases.map((tc, i) => 
        `Example ${i + 1}:\nInput: ${tc.input}\nOutput: ${tc.output}`
      ).join('\n\n');
    }
    
    return {
      title: problem.title || '',
      description: problem.description || '',
      visibletestCases: testCases, // ChatAi expects this field name
      startCode: startCode,
      // Add other fields ChatAi might use
      constraints: problem.constraints || '',
      difficulty: problem.difficulty || ''
    };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Chat with AI Assistant</h2>
            <p className="text-sm text-gray-400 mt-1">
              Problem: <span className="text-white font-medium">{problem?.title || 'Unknown'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden min-h-0">
          <ChatAi problem={getChatProblemData()} />
        </div>
      </div>
    </div>
  );
};

// Code Editor Component - FIXED: Pass correct data to ChatAiModal
const CodeEditor = ({ problem, onRun, onSubmit, isRunning, isSubmitting, onLanguageChange, language, editorTheme, fontSize, tabSize }) => {
  const [code, setCode] = useState(getDefaultCode('javascript'));
  const [showChatAi, setShowChatAi] = useState(false);
  const editorRef = useRef(null);

  // Get start code from problem schema
  const getStartCodeForLanguage = (lang) => {
    if (!problem || !problem.startCode || !Array.isArray(problem.startCode)) {
      return getDefaultCode(lang);
    }
    
    const codeObj = problem.startCode.find(item => item.language === lang);
    return codeObj ? codeObj.initialCode : getDefaultCode(lang);
  };

  // Reset code when language changes
  useEffect(() => {
    const defaultCode = getStartCodeForLanguage(language);
    setCode(defaultCode);
    if (editorRef.current) {
      editorRef.current.setValue(defaultCode);
    }
  }, [language, problem]);

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleRun = () => {
    console.log(`CodeEditor: Running ${language} code`);
    onRun(code, language);
  };

  const handleSubmit = () => {
    console.log(`CodeEditor: Submitting ${language} code`);
    onSubmit(code, language);
  };

  const handleReset = () => {
    const defaultCode = getStartCodeForLanguage(language);
    setCode(defaultCode);
    if (editorRef.current) {
      editorRef.current.setValue(defaultCode);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center bg-gray-800">
        <LanguageSelector language={language} onLanguageChange={onLanguageChange} />
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowChatAi(true)}
            className="px-4 py-2 text-sm font-medium bg-purple-700 hover:bg-purple-800 text-white rounded-lg flex items-center"
          >
            <span className="mr-2">🤖</span>
            Chat AI
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"
          >
            Reset Code
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              isRunning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-700 hover:bg-green-800 text-white'
            }`}
          >
            {isRunning ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Running...
              </span>
            ) : 'Run Code'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isRunning}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${
              isSubmitting
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                Submitting...
              </span>
            ) : 'Submit'}
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={editorTheme}
          onChange={setCode}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16 },
            tabSize: tabSize,
          }}
        />
      </div>

      <ChatAiModal
        isOpen={showChatAi}
        onClose={() => setShowChatAi(false)}
        problem={problem} // Pass the full problem object
      />
    </div>
  );
};

// Console Component (keep as is, no changes needed)
const Console = ({ output, onClear }) => {
  const getStatusColor = (passed, error) => {
    if (error) return 'text-red-400';
    return passed ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (passed, error) => {
    if (error) return '✗';
    return passed ? '✓' : '✗';
  };

  return (
    <div className="border-t border-gray-700 bg-gray-900">
      <div className="px-4 py-2 border-b border-gray-700 flex justify-between items-center">
        <h3 className="font-medium">Console</h3>
        <button 
          onClick={onClear}
          className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded"
        >
          Clear
        </button>
      </div>
      
      <div className="h-64 overflow-y-auto">
        {output.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">💻</div>
              <p>Run your code to see output here</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {output.map((item, index) => (
              <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                {item.title && (
                  <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 font-medium">
                    {item.title}
                  </div>
                )}
                
                <div className="p-4">
                  {item.input && (
                    <div className="mb-2">
                      <span className="text-gray-400">Input: </span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded font-mono">
                        {item.input}
                      </code>
                    </div>
                  )}
                  
                  {item.expected && (
                    <div className="mb-2">
                      <span className="text-gray-400">Expected: </span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded font-mono">
                        {item.expected}
                      </code>
                    </div>
                  )}
                  
                  {item.actual && (
                    <div className="mb-2">
                      <span className="text-gray-400">Actual: </span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded font-mono">
                        {item.actual}
                      </code>
                    </div>
                  )}
                  
                  {item.output && (
                    <div className="mb-2">
                      <span className="text-gray-400">Output: </span>
                      <code className="ml-2 bg-gray-800 px-2 py-1 rounded font-mono">
                        {item.output}
                      </code>
                    </div>
                  )}
                  
                  {item.result && (
                    <div className={`flex items-center ${getStatusColor(item.passed, item.error)}`}>
                      <span className="mr-2 text-lg">{getStatusIcon(item.passed, item.error)}</span>
                      <span className="font-medium">{item.result}</span>
                    </div>
                  )}
                  
                  {item.message && !item.error && (
                    <div className="mt-2 text-sm text-gray-300">
                      {item.message}
                    </div>
                  )}
                  
                  {item.testCasesPassed !== undefined && (
                    <div className="mt-3 p-3 bg-gray-800 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Test Cases:</span>
                        <span className={`font-medium ${item.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {item.testCasesPassed}/{item.testCasesTotal} passed
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-full rounded-full ${item.passed ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${(item.testCasesPassed / item.testCasesTotal) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {item.runtime && (
                    <div className="mt-2 text-sm text-gray-400">
                      Runtime: <span className="text-blue-400">{item.runtime}</span>
                    </div>
                  )}
                  
                  {item.memory && (
                    <div className="mt-1 text-sm text-gray-400">
                      Memory: <span className="text-blue-400">{item.memory}</span>
                    </div>
                  )}
                  
                  {item.errorDetails && (
                    <div className="mt-3 p-3 bg-red-900 rounded text-sm">
                      <span className="font-medium text-red-200">Error Details:</span>
                      <pre className="mt-1 text-red-300 whitespace-pre-wrap">{item.errorDetails}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Modal Component (keep as is, no changes needed)
const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange }) => {
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [theme, setTheme] = useState(settings.theme);
  const [tabSize, setTabSize] = useState(settings.tabSize);

  useEffect(() => {
    setFontSize(settings.fontSize);
    setTheme(settings.theme);
    setTabSize(settings.tabSize);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange({
      fontSize,
      theme,
      tabSize
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-96 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Editor Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Font Size
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFontSize(fontSize - 1)}
                className="px-3 py-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={fontSize <= 10}
              >
                -
              </button>
              <span className="text-gray-300 w-12 text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize(fontSize + 1)}
                className="px-3 py-1 bg-gray-700 rounded text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={fontSize >= 24}
              >
                +
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tab Size
            </label>
            <select
              value={tabSize}
              onChange={(e) => setTabSize(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={8}>8 spaces</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-300 focus:outline-none focus:border-blue-500"
            >
              <option value="vs-dark">VS Dark</option>
              <option value="light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ProblemPage Component - FIXED: Pass problem to CodeEditor
const ProblemPage = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('editorSettings');
    return saved ? JSON.parse(saved) : {
      fontSize: 14,
      theme: 'vs-dark',
      tabSize: 4
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [backendError, setBackendError] = useState(null);
  const [language, setLanguage] = useState('javascript');
  
  // States for solutions tab
  const [submissions, setSubmissions] = useState([]);
  const [solutions, setSolutions] = useState([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const [solutionsError, setSolutionsError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [refreshingSubmissions, setRefreshingSubmissions] = useState(false);
  const [copiedSolutions, setCopiedSolutions] = useState({});
  const [copiedSubmissionCode, setCopiedSubmissionCode] = useState(false);

  useEffect(() => {
    if (!problemId) {
      setBackendError('No problem ID provided');
      setLoading(false);
      return;
    }
    
    fetchProblemData();
    fetchSubmissionsData();
  }, [problemId]);

  // Fetch problem details
  const fetchProblemData = async () => {
    try {
      setLoading(true);
      setBackendError(null);
      
      const response = await axiosClient.get(`/problem/problem-by-id/${problemId}`);
      
      if (!response || !response.data) {
        setBackendError('No response from server');
        return;
      }
      
      console.log('[ProblemPage] Full response:', response.data);
      
      let problemData = null;
      
      if (response.data.success && response.data.problem) {
        problemData = response.data.problem;
      } else if (response.data.success && response.data.data) {
        problemData = response.data.data;
      } else if (response.data.problem) {
        problemData = response.data.problem;
      } else if (response.data.data) {
        problemData = response.data.data;
      } else if (response.data._id) {
        problemData = response.data;
      }
      
      if (!problemData) {
        setBackendError('Problem data is incomplete or invalid');
        return;
      }
      
      console.log('[ProblemPage] Problem data:', problemData);
      console.log('[ProblemPage] secureUrl:', problemData.secureUrl);
      console.log('[ProblemPage] videos:', problemData.videos);
      
      setProblem(problemData);
      
    } catch (error) {
      console.error('Error fetching problem:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          setBackendError('Please login to view this problem');
        } else if (status === 404) {
          setBackendError('Problem not found. Please check the problem ID.');
        } else if (status === 403) {
          setBackendError('You do not have permission to view this problem');
        } else if (status === 500) {
          setBackendError('Server error. Please try again later.');
        } else if (data && data.message) {
          setBackendError(data.message);
        } else {
          setBackendError(`Error ${status}: Failed to load problem`);
        }
      } else if (error.request) {
        setBackendError('No response from server. Please check your connection.');
      } else {
        setBackendError(error.message || 'Failed to fetch problem');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions
  const fetchSubmissionsData = async () => {
    try {
      setRefreshingSubmissions(true);
      
      const response = await axiosClient.get(`/problem/submitted/${problemId}`);
      
      if (!response || !response.data) {
        setSubmissions([]);
        return;
      }
      
      let submissionsData = [];
      
      if (response.data.success && response.data.submissions) {
        submissionsData = response.data.submissions;
      } else if (response.data.submissions) {
        submissionsData = response.data.submissions;
      } else if (response.data.success && response.data.data) {
        submissionsData = response.data.data;
      } else if (response.data.data) {
        submissionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        submissionsData = response.data;
      }
      
      setSubmissions(submissionsData);
      
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setSubmissions([]);
    } finally {
      setRefreshingSubmissions(false);
    }
  };

  // Fetch solutions
  const fetchSolutions = async () => {
    if (!problemId) return;
    
    try {
      setLoadingSolutions(true);
      setSolutionsError(null);
      
      const response = await axiosClient.get(`/problem/solutions/${problemId}`);
      
      if (response.data && response.data.success) {
        const solutionsData = response.data.solutions || [];
        setSolutions(solutionsData);
      } else {
        setSolutions([]);
        setSolutionsError('No solutions data received');
      }
      
    } catch (error) {
      console.error('Error fetching solutions:', error);
      setSolutionsError(error.response?.data?.message || error.message || 'Failed to load solutions');
      setSolutions([]);
    } finally {
      setLoadingSolutions(false);
    }
  };

  // Auto-fetch solutions when solutions tab is active
  useEffect(() => {
    if (activeTab === 'solutions' && problemId) {
      fetchSolutions();
    }
  }, [activeTab, problemId]);

  // Run code
  const handleRunCode = async (code, language) => {
    if (!code || !language) {
      setConsoleOutput([{
        title: "Validation Error",
        result: "Code or language is empty",
        passed: false,
        error: true
      }]);
      return;
    }
    
    setConsoleOutput([]);
    setIsRunning(true);
    
    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        language,
        code
      });
      
      if (!response || !response.data) {
        setConsoleOutput([{
          title: "Server Error",
          result: "No response from server",
          passed: false,
          error: true
        }]);
        return;
      }
      
      const responseData = response.data;
      
      if (Array.isArray(responseData)) {
        const testResults = responseData.map((testCase, index) => ({
          testCase: index + 1,
          input: testCase.input || '',
          expected: testCase.expected || '',
          actual: testCase.actual || testCase.output || '',
          passed: testCase.passed || false,
          error: testCase.error || null,
          runtime: testCase.runtime,
          memory: testCase.memory
        }));
        
        setConsoleOutput(testResults);
      } else {
        setConsoleOutput([{
          title: "Run Error",
          result: responseData.error || responseData.message || "Code execution failed",
          passed: false,
          error: true,
          errorDetails: responseData.details
        }]);
      }
      
    } catch (error) {
      console.error('Error running code:', error);
      
      let errorMessage = "Failed to run code";
      let errorDetails = "";
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          errorMessage = "Please login to run code";
        } else if (status === 400) {
          errorMessage = data.message || "Invalid code submission";
          errorDetails = data.error || data.details;
        } else if (status === 500) {
          errorMessage = "Server error while running code";
          errorDetails = data?.error || data?.details;
        } else if (data && data.message) {
          errorMessage = data.message;
          errorDetails = data.error || data.details;
        }
      }
      
      setConsoleOutput([{
        title: "Runtime Error",
        result: errorMessage,
        passed: false,
        error: true,
        errorDetails: errorDetails
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code
  const handleSubmitCode = async (code, language) => {
    if (!code || !language) {
      setConsoleOutput([{
        title: "Validation Error",
        result: "Code or language is empty",
        passed: false,
        error: true
      }]);
      return;
    }
    
    setConsoleOutput([]);
    setIsSubmitting(true);
    
    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        language,
        code
      });
      
      if (!response || !response.data) {
        setConsoleOutput([{
          title: "Server Error",
          result: "No response from server",
          passed: false,
          error: true
        }]);
        return;
      }
      
      const submission = response.data;
      const status = submission.status || 'pending';
      const passed = status === 'accepted';
      
      setConsoleOutput([{
        title: "Submission Result",
        result: status === 'accepted' ? '✅ All tests passed!' : 
                status === 'wrong answer' ? '❌ Wrong Answer' :
                status === 'runtime error' ? '❌ Runtime Error' :
                status === 'pending' ? '⏳ Processing...' :
                `❌ ${status}`,
        passed: passed,
        testCasesPassed: submission.testCasesPassed || 0,
        testCasesTotal: submission.testCasesTotal || 0,
        runtime: submission.runtime || 'N/A',
        memory: submission.memory || 'N/A',
        message: submission.errorMessage || 
                (status === 'accepted' ? 'All tests passed!' : 
                 status === 'wrong answer' ? 'Some test cases failed' :
                 status === 'runtime error' ? 'Runtime error occurred' :
                 'Submission processed'),
        errorDetails: submission.errorMessage
      }]);
      
      // Refresh submissions and solutions after submission
      setTimeout(() => {
        fetchSubmissionsData();
        if (status === 'accepted') {
          fetchSolutions();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error submitting code:', error);
      
      let errorMessage = "Failed to submit code";
      let errorDetails = "";
      
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          errorMessage = "Please login to submit code";
        } else if (status === 400) {
          errorMessage = data.message || "Invalid code submission";
          errorDetails = data.error || data.details;
        } else if (status === 500) {
          errorMessage = "Server error while submitting code";
          errorDetails = data?.error || data?.details;
        }
      }
      
      setConsoleOutput([{
        title: "Submission Error",
        result: errorMessage,
        passed: false,
        error: true,
        errorDetails: errorDetails
      }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearConsole = () => {
    setConsoleOutput([]);
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('editorSettings', JSON.stringify(newSettings));
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // View code from submission
  const handleViewCode = (submission) => {
    setSelectedSubmission(submission);
    setCopiedSubmissionCode(false);
    setShowCodeModal(true);
  };

  // Close code modal
  const handleCloseCodeModal = () => {
    setShowCodeModal(false);
    setSelectedSubmission(null);
    setCopiedSubmissionCode(false);
  };

  // Refresh submissions
  const handleRefreshSubmissions = async () => {
    await fetchSubmissionsData();
  };

  // Format runtime
  const formatRuntime = (runtime) => {
    if (!runtime) return 'N/A';
    if (typeof runtime === 'string') return runtime;
    if (typeof runtime === 'number') return `${runtime}ms`;
    return runtime;
  };

  // Format memory
  const formatMemory = (memory) => {
    if (!memory) return 'N/A';
    if (typeof memory === 'string') return memory;
    if (typeof memory === 'number') {
      if (memory < 1024) return `${memory} B`;
      if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(1)} kB`;
      return `${(memory / (1024 * 1024)).toFixed(1)} MB`;
    }
    return memory;
  };

  // Handle copy solution code
  const handleCopySolutionCode = (solutionId, code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedSolutions(prev => ({ ...prev, [solutionId]: true }));
        setTimeout(() => {
          setCopiedSolutions(prev => ({ ...prev, [solutionId]: false }));
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  // Handle copy submission code
  const handleCopySubmissionCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedSubmissionCode(true);
        setTimeout(() => setCopiedSubmissionCode(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading problem...</p>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Problem Not Found</h1>
          <p className="text-gray-400 mb-6">
            The problem you're looking for could not be loaded.
          </p>
          {backendError && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6">
              <p className="text-red-200">{backendError}</p>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-gray-300 w-full"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/problems'}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white w-full"
            >
              Browse Problems
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-900">
      {backendError && (
        <div className="px-4 py-2 bg-yellow-900 text-yellow-200 text-sm">
          <strong>Note:</strong> {backendError}
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Problem Details */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{problem.title || 'Untitled Problem'}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                problem.difficulty === 'easy' ? 'bg-green-900 text-green-300' :
                problem.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-300' :
                problem.difficulty === 'hard' ? 'bg-red-900 text-red-300' :
                'bg-gray-800 text-gray-300'
              }`}>
                {problem.difficulty ? problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="flex border-b border-gray-700">
            {['description', 'editorial', 'solutions', 'submissions'].map((tab) => (
              <button
                key={tab}
                className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'description' && <ProblemDescription problem={problem} />}
            
            {activeTab === 'editorial' && (
              <div className="text-gray-300 space-y-6">
                <h3 className="text-xl font-bold mb-4">Editorial</h3>
                <div className="bg-gray-800 rounded-lg p-6">
                  {problem && problem.secureUrl ? (
                    <Editorial 
                      secureUrl={problem.secureUrl} 
                      thumbnailUrl={problem.thumbnailUrl} 
                      duration={problem.duration}
                    />
                  ) : (
                    <p className="text-gray-500 italic">Editorial video not available yet.</p>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'solutions' && (
              <div className="text-gray-300 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Solutions</h3>
                  <button
                    onClick={fetchSolutions}
                    disabled={loadingSolutions}
                    className={`px-4 py-2 text-sm rounded-lg flex items-center ${
                      loadingSolutions
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loadingSolutions ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Loading...
                      </>
                    ) : (
                      'Refresh'
                    )}
                  </button>
                </div>
                
                {solutionsError && (
                  <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-200 text-sm">
                      <strong>Note:</strong> {solutionsError}
                    </p>
                  </div>
                )}
                
                {loadingSolutions ? (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading solutions from database...</p>
                  </div>
                ) : solutions.length > 0 ? (
                  <div className="space-y-4">
                    {solutions.map((solution, index) => {
                      const solutionId = solution._id || `solution-${index}`;
                      const isCopied = copiedSolutions[solutionId];
                      return (
                        <div key={solutionId} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-300 text-sm">
                                  {solution.author?.firstName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-300">{solution.author?.firstName || 'User'}</p>
                                <p className="text-xs text-gray-500">
                                  {solution.createdAt ? new Date(solution.createdAt).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                              {solution.language?.toUpperCase() || 'CODE'}
                            </span>
                          </div>
                          {solution.code && (
                            <div className="relative">
                              <pre className="text-sm font-mono bg-gray-900 p-3 rounded overflow-x-auto text-gray-300 whitespace-pre">
                                {solution.code.substring(0, 200)}{solution.code.length > 200 ? '...' : ''}
                              </pre>
                              <button
                                onClick={() => handleCopySolutionCode(solutionId, solution.code)}
                                className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                                  isCopied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                }`}
                              >
                                {isCopied ? '✓ Copied!' : 'Copy Code'}
                              </button>
                            </div>
                          )}
                          <div className="mt-3 flex justify-between text-xs text-gray-400">
                            <span>Runtime: {formatRuntime(solution.runtime)}</span>
                            <span>Memory: {formatMemory(solution.memory)}</span>
                            <span>Tests: {solution.testCasesPassed || 0}/{solution.testCasesTotal || 0}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">💡</div>
                    <p className="text-gray-400 mb-2">No solutions found for this problem</p>
                    <p className="text-gray-500 text-sm">
                      Solutions will appear here when users submit their accepted solutions.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'submissions' && (
              <div className="text-gray-300 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Your Submissions</h3>
                  <button
                    onClick={handleRefreshSubmissions}
                    disabled={refreshingSubmissions}
                    className={`px-4 py-2 text-sm rounded-lg flex items-center ${
                      refreshingSubmissions
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {refreshingSubmissions ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                        Loading...
                      </>
                    ) : (
                      'Refresh'
                    )}
                  </button>
                </div>
                
                {submissions.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-4">📝</div>
                    <p className="text-gray-400 mb-2">No submissions yet</p>
                    <p className="text-gray-500 text-sm">
                      Write your solution and click "Submit" to see your submissions here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submissions.map((submission, index) => (
                      <div key={submission._id || index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-300">Submission #{index + 1}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            submission.status === 'accepted' ? 'bg-green-900 text-green-300' :
                            submission.status === 'wrong answer' ? 'bg-red-900 text-red-300' :
                            'bg-yellow-900 text-yellow-300'
                          }`}>
                            {submission.status || 'Pending'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mb-3">
                          <span>Language: {submission.language?.toUpperCase() || 'Unknown'}</span>
                          <span>Runtime: {formatRuntime(submission.runtime)}</span>
                          <span>Memory: {formatMemory(submission.memory)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : 'Unknown date'}
                          </span>
                          <button
                            onClick={() => handleViewCode(submission)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View Code
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Panel - Code Editor & Console */}
        <div className="w-1/2 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-medium text-gray-300">Code Editor</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded text-gray-300 transition-colors"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
          
          <div className="flex-1">
            <CodeEditor
              problem={problem} // Pass problem to CodeEditor
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              onLanguageChange={handleLanguageChange}
              language={language}
              editorTheme={settings.theme}
              fontSize={settings.fontSize}
              tabSize={settings.tabSize}
            />
          </div>
          
          <Console output={consoleOutput} onClear={handleClearConsole} />
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Code Modal for viewing submission code */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Submission Code</h2>
                <p className="text-sm text-gray-400">
                  Language: <span className="text-blue-300">{selectedSubmission.language?.toUpperCase()}</span>
                  {selectedSubmission.createdAt && (
                    <span className="ml-4">
                      Submitted: {new Date(selectedSubmission.createdAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopySubmissionCode(selectedSubmission.code)}
                  className={`px-3 py-1 text-sm rounded ${
                    copiedSubmissionCode
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedSubmissionCode ? '✓ Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleCloseCodeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-sm font-mono bg-gray-900 p-4 rounded overflow-x-auto text-gray-300 whitespace-pre">
                {selectedSubmission.code || 'No code available'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;