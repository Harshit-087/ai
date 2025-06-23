import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

function ResumeClassifier() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const classifyResume = async () => {
    if (!input.trim()) {
      alert("Please enter resume text");
      return;
    }
  
    setLoading(true); 
    try {
      const response = await axios.post(
        'http://localhost:3001/api/classify',
        [{ text: input }],
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
  
      const processedResults = Array.isArray(response.data)
        ? response.data
        : [response.data];
  
      const newResults = processedResults.map(result => ({
        predicted_label: result.predicted_label,
        confidence: result.confidence,
        resume: input,
        name: result.name,
        email: result.email,
        phone: result.phone,
      }));
  
      const existing = JSON.parse(localStorage.getItem("results")) || [];
      const updatedResults = [...existing, ...newResults];
      localStorage.setItem("results", JSON.stringify(updatedResults));
      setResults(updatedResults);
      setInput("");
      
      navigate("/Admin", {
        state: {
          analysisResults: updatedResults,
        },
      });
  
      setInput("");
    } catch (error) {
      console.error("Classification error:", error);
      alert(`Error: ${error.response?.data?.detail || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Resume Analyzer</h1>
          <p className="text-center text-gray-600 mb-8">Paste candidate resume to analyze skills and qualifications</p>
          
          <div className="relative">
            <textarea
              className="w-full p-6 border border-gray-200 rounded-lg bg-gray-50/50 h-72 text-gray-800 
                        resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-all duration-200 shadow-sm text-base"
              placeholder="Paste resume text here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            {!input && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-gray-400/80">Or drag & drop a .pdf or .docx file</span>
              </div>
            )}
          </div>

          <button
            className={`mt-6 w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200
                      ${loading ? 'bg-gray-300 cursor-not-allowed' : 
                        'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'}
                      text-white flex items-center justify-center space-x-2`}
            onClick={classifyResume}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              'Analyze Resume'
            )}
          </button>

          {results.length === 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
              <p className="text-blue-700">No analysis yet. Paste a resume to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeClassifier;