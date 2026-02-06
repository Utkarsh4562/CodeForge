import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Send } from "lucide-react";
import axiosClient from "../utils/axiosClient";

function ChatAi({ problem }) {
  const [messages, setMessages] = useState([
    { role: "model", parts: [{ text: "Hi, how are you?" }] },
    { role: "user", parts: [{ text: "I am good" }] }
  ]);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatContainerHeight, setChatContainerHeight] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const formRef = useRef(null);
  const chatAiRef = useRef(null); // Ref to the main container

  // Calculate available height for chat container
  useEffect(() => {
    const updateHeight = () => {
      if (chatAiRef.current) {
        const totalHeight = chatAiRef.current.clientHeight;
        const inputForm = chatAiRef.current.querySelector('.input-form-area');
        if (inputForm) {
          const inputHeight = inputForm.clientHeight;
          const chatHeight = totalHeight - inputHeight;
          setChatContainerHeight(chatHeight);
        }
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea based on content
  const handleTextareaInput = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 150);
    textarea.style.height = `${newHeight}px`;
  };

  // Handle Enter key press (Submit on Enter, Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line
      
      // Submit the form if there's text
      if (e.target.value.trim()) {
        if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }
      }
    }
    // Shift+Enter will still create a new line
  };

  // Handle chat scroll to show/hide scroll to bottom button
  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
      setShowScrollToBottom(!isAtBottom);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    setShowScrollToBottom(false);
  };

  // Initialize chat container scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleChatScroll);
      // Initial check
      handleChatScroll();
    }
    
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener('scroll', handleChatScroll);
      }
    };
  }, []);

  const onSubmit = async (data) => {
    const userMessage = data.message.trim();
    if (!userMessage || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Add user message to UI
    const newUserMessage = { role: "user", parts: [{ text: userMessage }] };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Clear input immediately
    reset({ message: "" });
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus(); // Keep focus on textarea
    }

    try {
      // Prepare conversation history for API
      const conversationHistory = [
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.parts[0].text
        })),
        { role: "user", content: userMessage }
      ];
      
      const response = await axiosClient.post("/ai/chat", {
        messages: conversationHistory,
        title: problem?.title || "",
        description: problem?.description || "",
        testCases: problem?.visibletestCases || "",
        startCode: problem?.startCode || ""
      });

      // Add AI response
      if (response.data.response) {
        setMessages(prev => [
          ...prev,
          {
            role: "model",
            parts: [{ text: response.data.response }]
          }
        ]);
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "model",
          parts: [{ text: "Error: " + (error.response?.data?.error || error.message || "Something went wrong") }]
        }
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div ref={chatAiRef} className="flex flex-col h-full">
      {/* Chat Messages Container with EXACT height */}
      <div 
        ref={chatContainerRef}
        className="overflow-y-auto p-4"
        style={{ 
          height: chatContainerHeight > 0 ? `${chatContainerHeight}px` : 'auto',
          minHeight: 0
        }}
      >
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-lg px-4 py-3 ${
                  msg.role === "user" 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <div className="whitespace-pre-wrap wrap-break-words">
                  {msg.parts[0].text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center z-10 transition-opacity duration-200"
            aria-label="Scroll to bottom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Input Form - ALWAYS VISIBLE at bottom */}
      <div className="border-t border-gray-700 p-4 input-form-area">
        <form
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col"
        >
          <div className="flex items-end gap-3">
            <textarea
              {...register("message", { 
                required: "Message is required",
                minLength: {
                  value: 1,
                  message: "Message must be at least 1 character"
                },
                maxLength: {
                  value: 2000,
                  message: "Message is too long (max 2000 characters)"
                }
              })}
              ref={(e) => {
                textareaRef.current = e;
                if (e) {
                  register("message").ref(e);
                }
              }}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-auto min-h-15 max-h-37.5"
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              rows={1}
              onInput={handleTextareaInput}
              onKeyDown={handleKeyDown}
              style={{ height: "60px" }}
              disabled={isSubmitting}
            />
            
            <button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 h-15 w-15 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || errors.message}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </div>
          
          {errors.message && (
            <p className="text-red-400 text-sm mt-2 px-1">
              {errors.message.message}
            </p>
          )}
          
          <div className="text-xs text-gray-500 mt-2 px-1">
            Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> to send • 
            Press <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">Enter</kbd> for new line
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatAi;