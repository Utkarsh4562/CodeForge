import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { useNavigate } from 'react-router-dom';

/*ZOD SCHEMA */
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.enum(['array', 'string', 'dp', 'graph', 'hash-table', 'math', 'stack', 'two-pointers'])).min(1, 'Select at least one tag'),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
    })
  ).min(1, 'Add at least one visible test case'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string().min(1, 'Output is required'),
    })
  ),
  startCode: z.array(
    z.object({
      language: z.string(),
      initialCode: z.string().min(10, 'Initial code must be at least 10 characters'),
    })
  ),
  refrenceSolution: z.array(
    z.object({
      language: z.string(),
      completeCode: z.string().min(10, 'Solution code must be at least 10 characters'),
    })
  ),
});

/*LANGUAGES CONFIG  */
const LANGUAGES = [
  { id: 'cpp', name: 'C++', icon: '⚙️', placeholder: '#include <bits/stdc++.h>' },
  { id: 'java', name: 'Java', icon: '☕', placeholder: 'public class Solution' },
  { id: 'javascript', name: 'JavaScript', icon: '📜', placeholder: 'function solution()' },
];

/* ================= SAMPLE PROBLEM ================= */
const SAMPLE_PROBLEM = {
  title: 'Valid Parentheses',
  description: `# Valid Parentheses

Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:

1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

## Examples:

**Example 1:**
Input: s = "()"
Output: true

**Example 2:**
Input: s = "()[]{}"
Output: true

**Example 3:**
Input: s = "(]"
Output: false

**Example 4:**
Input: s = "([)]"
Output: false

**Example 5:**
Input: s = "{[]}"
Output: true

## Constraints:
- 1 <= s.length <= 10^4
- s consists of parentheses only '()[]{}'.`,
  difficulty: 'easy',
  tags: ['string', 'stack'],
  visibleTestCases: [
    { input: '()', output: 'true' },
    { input: '()[]{}', output: 'true' },
    { input: '(]', output: 'false' }
  ],
  hiddenTestCases: [
    { input: '([)]', output: 'false' },
    { input: '{[]}', output: 'true' },
    { input: '', output: 'true' }
  ],
  startCode: [
    {
      language: 'cpp',
      initialCode: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

bool isValid(string s) {
    // Write your code here
    return false;
}

int main() {
    string s;
    getline(cin, s);
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`
    },
    {
      language: 'java',
      initialCode: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        // Write your code here
        return false;
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isValid(s));
        sc.close();
    }
}`
    },
    {
      language: 'javascript',
      initialCode: `function isValid(s) {
  // Write your code here
  return false;
}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();
console.log(isValid(input));`
    }
  ],
  refrenceSolution: [
    {
      language: 'cpp',
      completeCode: `#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>
using namespace std;

bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> map = {
        {')', '('},
        {']', '['},
        {'}', '{'}
    };
    
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty() || st.top() != map[c]) {
                return false;
            }
            st.pop();
        }
    }
    
    return st.empty();
}

int main() {
    string s;
    getline(cin, s);
    cout << (isValid(s) ? "true" : "false") << endl;
    return 0;
}`
    },
    {
      language: 'java',
      completeCode: `import java.util.*;

public class Main {
    public static boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        Map<Character, Character> map = new HashMap<>();
        map.put(')', '(');
        map.put(']', '[');
        map.put('}', '{');
        
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty() || stack.pop() != map.get(c)) {
                    return false;
                }
            }
        }
        
        return stack.isEmpty();
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        System.out.println(isValid(s));
        sc.close();
    }
}`
    },
    {
      language: 'javascript',
      completeCode: `function isValid(s) {
  const stack = [];
  const map = {
    '(': ')',
    '[': ']',
    '{': '}'
  };
  
  for (let char of s) {
    if (char in map) {
      // Opening bracket
      stack.push(char);
    } else {
      // Closing bracket
      const last = stack.pop();
      if (map[last] !== char) {
        return false;
      }
    }
  }
  
  return stack.length === 0;
}

const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim();
console.log(isValid(input));`
    }
  ]
};

/*MAIN COMPONENT  */
function AdminPanel() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeLanguage, setActiveLanguage] = useState('cpp');
  const [showDebug, setShowDebug] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      tags: [],
      visibleTestCases: [{ input: '', output: '' }],
      hiddenTestCases: [{ input: '', output: '' }],
      startCode: LANGUAGES.map(lang => ({ language: lang.id, initialCode: '' })),
      refrenceSolution: LANGUAGES.map(lang => ({ language: lang.id, completeCode: '' })),
    },
    mode: 'onChange',
  });

  const {
    fields: visibleTestCases,
    append: appendVisibleTestCase,
    remove: removeVisibleTestCase,
  } = useFieldArray({ control, name: 'visibleTestCases' });

  const {
    fields: hiddenTestCases,
    append: appendHiddenTestCase,
    remove: removeHiddenTestCase,
  } = useFieldArray({ control, name: 'hiddenTestCases' });

  const formValues = watch();

  /*  SUBMIT HANDLER  */
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    setRedirectCountdown(0);

    console.log('Submitting:', data);

    try {
      // Format data for backend
      const formattedData = {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        visibleTestCases: data.visibleTestCases,
        hiddenTestCases: data.hiddenTestCases,
        startCode: data.startCode,
        refrenceSolution: data.refrenceSolution
      };

      const response = await axiosClient.post('/problem/create', formattedData);
      console.log('Response:', response.data);
      
      setSuccess(' Problem created successfully! Redirecting to admin page...');
      
      // Start countdown
      let countdown = 3;
      setRedirectCountdown(countdown);
      
      const countdownInterval = setInterval(() => {
        countdown--;
        setRedirectCountdown(countdown);
        
        if (countdown <= 0) {
          clearInterval(countdownInterval);
          reset();
          navigate('/admin');
        }
      }, 1000);
      
    } catch (err) {
      console.error(' Full error:', err);
      
      // Extract error message
      let errorMsg = 'Failed to create problem';
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' 
          ? err.response.data 
          : err.response.data.message || err.response.data.error || JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(`❌ ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSample = () => {
    reset(SAMPLE_PROBLEM);
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  const handleCreateAnother = () => {
    reset();
    setSuccess('');
    setError('');
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      // Clear any intervals
    };
  }, []);

  /*  UI  */
  return (
    <div className="min-h-screen bg-linear-to-br from-base-100 to-base-200 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-base-content">
                Create Coding Problem
              </h1>
              <p className="text-base-content/70 mt-2">
                Design challenges for your platform
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={loadSample}
                className="btn btn-primary btn-outline"
              >
                 Load Sample
              </button>
              <button
                type="button"
                onClick={handleBackToAdmin}
                className="btn btn-ghost"
              >
                ← Back to Admin
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="alert alert-error shadow-lg mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Error!</h3>
                <div className="text-xs">{error}</div>
              </div>
            </div>
          )}

          {success && (
            <div className="alert alert-success shadow-lg mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-bold">Success!</h3>
                <div className="text-xs">
                  {success} {redirectCountdown > 0 && `(${redirectCountdown}s)`}
                </div>
              </div>
            </div>
          )}
        </div>

        {!success ? (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Section 1: Basic Info */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="badge badge-primary badge-lg p-3">1</div>
                    <h2 className="card-title text-2xl">Basic Information</h2>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Problem Title *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Reverse String, Two Sum"
                        className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
                        {...register('title')}
                      />
                      {errors.title && (
                        <div className="label">
                          <span className="label-text-alt text-error">{errors.title.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Description *</span>
                        <span className="label-text-alt">{formValues.description?.length || 0}/5000</span>
                      </label>
                      <textarea
                        placeholder={`# Problem Description\n\n## Examples:\nInput: ...\nOutput: ...\n\n## Constraints:\n- Constraint 1\n- Constraint 2`}
                        className={`textarea textarea-bordered h-64 ${errors.description ? 'textarea-error' : ''}`}
                        {...register('description')}
                      />
                      {errors.description && (
                        <div className="label">
                          <span className="label-text-alt text-error">{errors.description.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Difficulty & Tags */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Difficulty *</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...register('difficulty')}
                        >
                          <option value="easy">🟢 Easy</option>
                          <option value="medium">🟡 Medium</option>
                          <option value="hard">🔴 Hard</option>
                        </select>
                      </div>

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-semibold">Tags *</span>
                          <span className="label-text-alt">{formValues.tags?.length || 0} selected</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['array', 'string', 'dp', 'graph', 'hash-table', 'math', 'stack', 'two-pointers'].map((tag) => (
                            <label key={tag} className="cursor-pointer">
                              <input
                                type="checkbox"
                                value={tag}
                                className="hidden peer"
                                {...register('tags')}
                              />
                              <span className="badge badge-lg badge-outline hover:badge-primary peer-checked:badge-primary">
                                {tag}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.tags && (
                          <div className="label">
                            <span className="label-text-alt text-error">{errors.tags.message}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Test Cases */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="badge badge-secondary badge-lg p-3">2</div>
                    <h2 className="card-title text-2xl">Test Cases</h2>
                  </div>

                  <div className="space-y-8">
                    {/* Visible Test Cases */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold">👁️ Visible Test Cases</h3>
                          <p className="text-sm opacity-70">Shown to users for testing</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendVisibleTestCase({ input: '', output: '' })}
                          className="btn btn-primary btn-sm"
                        >
                          + Add Case
                        </button>
                      </div>

                      <div className="space-y-4">
                        {visibleTestCases.map((field, index) => (
                          <div key={field.id} className="card bg-base-200">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Test Case #{index + 1}</h4>
                                {visibleTestCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeVisibleTestCase(index)}
                                    className="btn btn-xs btn-error"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                  <label className="label">
                                    <span className="label-text">Input</span>
                                  </label>
                                  <textarea
                                    placeholder="Test input"
                                    className="textarea textarea-bordered font-mono"
                                    {...register(`visibleTestCases.${index}.input`)}
                                  />
                                </div>
                                <div className="form-control">
                                  <label className="label">
                                    <span className="label-text">Expected Output</span>
                                  </label>
                                  <textarea
                                    placeholder="Expected output"
                                    className="textarea textarea-bordered font-mono"
                                    {...register(`visibleTestCases.${index}.output`)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Hidden Test Cases */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold"> Hidden Test Cases</h3>
                          <p className="text-sm opacity-70">For final evaluation only</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => appendHiddenTestCase({ input: '', output: '' })}
                          className="btn btn-secondary btn-sm"
                        >
                          + Add Hidden
                        </button>
                      </div>

                      <div className="space-y-4">
                        {hiddenTestCases.map((field, index) => (
                          <div key={field.id} className="card bg-base-200">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Hidden Case #{index + 1}</h4>
                                {hiddenTestCases.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeHiddenTestCase(index)}
                                    className="btn btn-xs btn-error"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                  <label className="label">
                                    <span className="label-text">Input</span>
                                  </label>
                                  <textarea
                                    placeholder="Hidden test input"
                                    className="textarea textarea-bordered font-mono"
                                    {...register(`hiddenTestCases.${index}.input`)}
                                  />
                                </div>
                                <div className="form-control">
                                  <label className="label">
                                    <span className="label-text">Expected Output</span>
                                  </label>
                                  <textarea
                                    placeholder="Expected output"
                                    className="textarea textarea-bordered font-mono"
                                    {...register(`hiddenTestCases.${index}.output`)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Code Templates */}
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="badge badge-accent badge-lg p-3">3</div>
                    <h2 className="card-title text-2xl">Code Templates</h2>
                  </div>

                  {/* Language Tabs */}
                  <div className="tabs tabs-boxed mb-6">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        className={`tab tab-lg ${activeLanguage === lang.id ? 'tab-active' : ''}`}
                        onClick={() => setActiveLanguage(lang.id)}
                      >
                        {lang.icon} {lang.name}
                      </button>
                    ))}
                  </div>

                  {/* Code Editors */}
                  {LANGUAGES.map((lang, index) => (
                    <div key={lang.id} className={activeLanguage === lang.id ? 'block' : 'hidden'}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Starter Code */}
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-blue-500"></span> Starter Code
                          </h3>
                          <div className="mockup-code bg-base-300">
                            <pre className="p-4">
                              <textarea
                                placeholder={`// ${lang.name} starter code...`}
                                className="textarea w-full h-64 bg-transparent border-0 font-mono"
                                {...register(`startCode.${index}.initialCode`)}
                              />
                            </pre>
                          </div>
                          {errors.startCode?.[index]?.initialCode && (
                            <div className="label mt-2">
                              <span className="label-text-alt text-error">
                                {errors.startCode[index].initialCode.message}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Reference Solution */}
                        <div>
                          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span className="text-green-500">✅</span> Reference Solution
                          </h3>
                          <div className="mockup-code bg-base-300">
                            <pre className="p-4">
                              <textarea
                                placeholder={`// ${lang.name} solution...`}
                                className="textarea w-full h-64 bg-transparent border-0 font-mono"
                                {...register(`refrenceSolution.${index}.completeCode`)}
                              />
                            </pre>
                          </div>
                          {errors.refrenceSolution?.[index]?.completeCode && (
                            <div className="label mt-2">
                              <span className="label-text-alt text-error">
                                {errors.refrenceSolution[index].completeCode.message}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="sticky bottom-6 bg-base-100/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDebug(!showDebug)}
                      className="btn btn-ghost btn-sm"
                    >
                      {showDebug ? '👁️ Hide Data' : '👁️ Show Data'}
                    </button>
                    <button
                      type="button"
                      onClick={() => reset()}
                      className="btn btn-outline btn-sm"
                      disabled={isSubmitting}
                    >
                      Clear Form
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {!isValid && (
                      <div className="text-warning text-sm">
                        Please fill all required fields
                      </div>
                    )}
                    <button
                      type="submit"
                      className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`}
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? 'Creating...' : ' Create Problem'}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Debug Info */}
            {showDebug && (
              <div className="mt-8 card bg-base-200">
                <div className="card-body">
                  <h3 className="card-title">📦 Data to be Sent</h3>
                  <div className="mockup-code">
                    <pre className="p-4 max-h-96 overflow-auto text-xs">
                      {JSON.stringify(formValues, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ✅ FIXED: Success Screen with working buttons */
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-16">
              <div className="text-6xl mb-6">🎉</div>
              <h2 className="card-title text-3xl mb-4">Problem Created Successfully!</h2>
              <p className="text-lg mb-8">
                Your coding problem has been added to the platform.
              </p>
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  {redirectCountdown > 0 
                    ? `Redirecting to admin page in ${redirectCountdown} seconds...`
                    : 'Redirecting now...'}
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    type="button"
                    onClick={handleBackToAdmin}
                    className="btn btn-primary"
                  >
                    Go to Admin Panel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateAnother}
                    className="btn btn-outline"
                  >
                    Create Another Problem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;