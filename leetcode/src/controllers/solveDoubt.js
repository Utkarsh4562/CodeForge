const { GoogleGenerativeAI } = require("@google/generative-ai");

const solveDoubt = async (req, res) => {
  try {
    if (!req.result) return res.status(401).json({ error: "Unauthorized" });
    
    // Accept both 'messages' and 'message'
    const { messages, message, title, description, testCases, startCode } = req.body;
    
    // Handle both formats
    let conversationMessages = messages;
    if (!messages && message) {
      conversationMessages = [{ role: "user", content: message }];
    }
    
    if (!conversationMessages) return res.status(400).json({ error: "Message required" });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    });

    // COMPLETE SYSTEM INSTRUCTIONS - FIXED: Allow general DSA questions
    const systemPrompt = `# SYSTEM INSTRUCTIONS - DSA TUTOR

## YOUR ROLE: Expert Data Structures and Algorithms (DSA) tutor.

## CURRENT PROBLEM CONTEXT (if provided):
[PROBLEM_TITLE]: ${title || "Not specified"}
[PROBLEM_DESCRIPTION]: ${description?.substring(0, 300) || "Not provided"}
[EXAMPLES]: ${testCases?.substring(0, 200) || "None"}
[START_CODE]: ${startCode?.substring(0, 200) || "None"}

## YOUR CAPABILITIES:
1. General DSA Educator: Teach any DSA concept (arrays, linked lists, stacks, queues, trees, graphs, etc.)
2. Hint Provider: Step-by-step hints without full solutions
3. Code Reviewer: Debug and fix code with explanations
4. Solution Guide: Optimal solutions with detailed explanations
5. Complexity Analyzer: Time/space complexity trade-offs
6. Approach Suggester: Multiple algorithmic approaches
7. Test Case Helper: Edge case test creation
8. Code Provider: Provide complete solution code when explicitly asked

## INTERACTION GUIDELINES:

### GENERAL APPROACH:
- Answer ALL DSA-related questions (arrays, linked lists, stacks, queues, trees, graphs, sorting, searching, DP, etc.)
- If user asks about a specific problem (title/description provided), relate answers to that problem
- If user asks general DSA questions, provide comprehensive explanations
- For hints: give step-by-step guidance without full code
- For debugging: identify bugs and provide fixes with explanations
- For complexity analysis: explain time/space complexity in detail
- For explanations: provide clear, detailed explanations
- For code requests: provide complete solution with explanations

### FOR PROVIDING COMPLETE CODE:
- Provide complete, working solution code when user explicitly asks for code/solution
- This includes when user describes a problem and then asks for code
- When providing code, include:
  1. Clear explanation of the approach
  2. Well-commented, clean code
  3. Time and space complexity analysis
  4. Test cases to verify
- IMPORTANT: Continue to provide hints, debugging, explanations, and all other types of help as requested

## RESPONSE FORMAT:
- Clear, concise explanations
- Code with syntax highlighting when appropriate
- Examples to illustrate
- Break into digestible parts
- Relate to current problem if provided, otherwise give general DSA guidance

## ACCEPTABLE TOPICS:
- ALL Data Structures: Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Hash Tables, Heaps, Tries, etc.
- ALL Algorithms: Sorting, Searching, Recursion, Dynamic Programming, Greedy, Backtracking, Divide & Conquer, etc.
- Complexity Analysis: Time/Space complexity, Big O notation
- Problem Solving Strategies
- Code implementation in various languages
- Interview preparation questions
- Best coding practices

## STRICT LIMITATIONS:
- ONLY discuss programming, computer science, and DSA topics
- NO non-DSA topics (web dev frameworks, databases, mobile dev, etc.) unless directly related to DSA concepts
- If unrelated to programming/DSA: "I can only help with programming and DSA concepts."

## TEACHING PHILOSOPHY:
- Understanding over memorization
- Guide to discover solutions
- Explain "why" behind choices
- Build problem-solving intuition
- Promote best coding practices

Goal: Help users learn ALL DSA concepts. Provide appropriate assistance whether user asks about specific problems or general DSA topics.`;

    // Prepare conversation history - keep it concise
    let conversationText = "";
    if (Array.isArray(conversationMessages)) {
      // Take only last few messages to stay within token limits
      const recentMessages = conversationMessages.slice(-4); // Last 4 messages max
      conversationText = recentMessages.map(msg => 
        `${msg.role}: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? '...' : ''}`
      ).join('\n');
    } else {
      conversationText = `User: ${conversationMessages.substring(0, 200)}`;
    }

    // Check if user is explicitly asking for code (from the latest message)
    const latestUserMessage = Array.isArray(conversationMessages) 
      ? conversationMessages[conversationMessages.length - 1]?.content || ""
      : conversationMessages;
    
    // IMPROVED PATTERN: Better detection of code requests
    const codeRequestPatterns = [
      /\b(?:send|show|give|provide|share|write|share)\s+(?:me\s+)?(?:the\s+)?(?:code|solution|implementation)\b/i,
      /\b(?:code|solution|implementation)\s+(?:please|pls|plz|for\s+(?:this|that|the))\b/i,
      /\b(?:can\s+you\s+)?(?:write|provide|give)\s+(?:me\s+)?(?:the\s+)?(?:code|solution)\b/i,
      /\b(?:how\s+to\s+implement|implement(?:ation)?\s+of)\b/i,
      /\b(?:need\s+code|want\s+code|looking\s+for\s+code)\b/i,
      /\b(?:solve\s+this\s+(?:problem|question)\s+with\s+code)\b/i,
      /\b(?:complete\s+code|full\s+code|entire\s+code)\b/i
    ];
    
    // Also check if the message contains programming/problem description AND code request keywords
    const hasProgrammingTerms = /\b(?:function|algorithm|array|string|tree|graph|sort|search|dynamic|programming|solve|problem|question)\b/i.test(latestUserMessage);
    const hasCodeKeywords = /\b(?:code|solution|implement|write\s+code|provide\s+code)\b/i.test(latestUserMessage);
    
    // User is asking for code if:
    // 1. Direct match with code request patterns, OR
    // 2. Contains programming terms AND code keywords
    const isAskingForCode = codeRequestPatterns.some(pattern => pattern.test(latestUserMessage)) ||
                           (hasProgrammingTerms && hasCodeKeywords);

    // Final prompt with everything
    const finalPrompt = `${systemPrompt}

## CONVERSATION HISTORY:
${conversationText}

## USER'S LATEST REQUEST:
"${latestUserMessage.substring(0, 200)}"
${isAskingForCode ? "\nNOTE: User appears to be asking for complete solution code. Provide a well-explained solution with code." : ""}

## YOUR RESPONSE (as DSA Tutor):
Provide appropriate assistance based on the user's request. ${isAskingForCode ? "Since they asked for code, include complete solution code with detailed explanations." : "Provide helpful guidance as requested (hints, debugging, explanations, etc.)."}`;

    // Generate response
    const result = await model.generateContent(finalPrompt);
    const response = result.response.text();

    res.status(200).json({
      success: true,
      response: response
    });

  } catch (error) {
    console.error("Controller Error:", error.message);
    res.status(500).json({
      success: false,
      error: "AI service error: " + error.message
    });
  }
};

module.exports = solveDoubt;