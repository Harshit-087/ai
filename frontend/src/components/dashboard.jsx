import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Search, Upload, UserCheck, UserX, Sliders, ArrowUpDown, Download, Filter, Eye, FileText, ChevronDown, X } from 'lucide-react';

const ResumeScreenerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // CHANGE: Combined state management to share data between components
  const [results, setResults] = useState(() => {
    const fromLocation = location.state?.analysisResults || [];
    if (fromLocation && fromLocation.length > 0) {
      localStorage.setItem("results", JSON.stringify(fromLocation));
    }
    const fromStorage = localStorage.getItem("results");
    return fromStorage ? JSON.parse(fromStorage) : [];
  });
  
  const [currentResumeIndex, setCurrentResumeIndex] = useState(0);
  
  // CHANGE: Added filter states that will be shared between components
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    position: "",
    status: "",
    minScore: 0,
    searchTerm: ""
  });
  
  // CHANGE: Added sorting state
  const [sortBy, setSortBy] = useState('score');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // CHANGE: Added state for modal visibility
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // CHANGE: Added filtered results state to apply filters from UI
  const [filteredResults, setFilteredResults] = useState(results);

  // CHANGE: Effect to refilter results when filters or sort changes
  useEffect(() => {
    let filtered = [...results];
    
    // Apply text search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => 
        (candidate.name && candidate.name.toLowerCase().includes(term)) ||
        (candidate.email && candidate.email.toLowerCase().includes(term)) ||
        (candidate.predicted_label && candidate.predicted_label.toLowerCase().includes(term))
      );
    }
    
    // Apply position filter
    if (filters.position) {
      filtered = filtered.filter(candidate => 
        candidate.predicted_label && candidate.predicted_label.toLowerCase().includes(filters.position.toLowerCase())
      );
    }
    
    // Apply status filter - assuming we map confidence scores to statuses
    if (filters.status) {
      filtered = filtered.filter(candidate => {
        const score = candidate.confidence * 1.5;
        const status = score > 0.7 ? 'qualified' : score > 0.4 ? 'reviewing' : 'rejected';
        return status === filters.status;
      });
    }
    
    // Apply minimum score filter
    if (filters.minScore > 0) {
      filtered = filtered.filter(candidate => 
        (candidate.confidence * 1.5) >= (filters.minScore / 100)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (sortBy === 'score') {
        return direction * ((b.confidence * 1.5) - (a.confidence * 1.5));
      } else if (sortBy === 'name') {
        return direction * (a.name || '').localeCompare(b.name || '');
      } else {
        // Default to score
        return direction * ((b.confidence * 1.5) - (a.confidence * 1.5));
      }
    });
    
    setFilteredResults(filtered);
  }, [results, filters, sortBy, sortDirection]);

  const clearAllCandidates = () => {
    setResults([]);
    setFilteredResults([]);
    navigate("/Admin", { state: { analysisResults: [] } });
    localStorage.removeItem("results");
  };
  
  // CHANGE: Added handler for search filter
  const handleSearchChange = (e) => {
    setFilters({...filters, searchTerm: e.target.value});
  };
  
  // CHANGE: Added handler for applying all filters
  const applyFilters = () => {
    // Already handled by the useEffect
    setShowFilters(false);
  };
  
  // CHANGE: Added handler for resetting filters
  const resetFilters = () => {
    setFilters({
      position: "",
      status: "",
      minScore: 0,
      searchTerm: ""
    });
  };
  
  // CHANGE: Added handler for sorting
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };
  
  // CHANGE: Added handler for viewing candidate details
  const viewCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };
  
  // CHANGE: Helper function to determine status based on score
  const getStatusFromScore = (score) => {
    const adjustedScore = score * 1.5;
    if (adjustedScore > 0.7) return "qualified";
    if (adjustedScore > 0.4) return "reviewing";
    return "rejected";
  };
  
  // CHANGE: Helper function for status color
  const getStatusColor = (status) => {
    if (status === "qualified") return "bg-green-100 text-green-800";
    if (status === "reviewing") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  // If no results are available
  if (results.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* CHANGE: Kept the header from the UI component */}
        <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Resume Screener</h1>
            <div className="flex items-center space-x-4">
              <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                <Download size={16} className="mr-2" />
                Export
              </button>
              <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                <a href="/"><Upload size={16} className="mr-2" />
                Upload Resumes</a>
              </button>
            </div>
          </div>
        </header>
        
        <div className="p-4 bg-gray-100 rounded-lg text-center m-6">
          <p>No analysis results available</p>
        </div>
      </div>
    );
  }

  // CHANGE: Calculate graph data from filtered results instead of all results
  const graphData = filteredResults.map((res, index) => ({
    name: res.name ? res.name.split(' ')[0] : `Res ${index + 1}`,
    confidence: +(res.confidence * 1.5).toFixed(2),
  }));

  // CHANGE: Safe access for current resume
  const currentResume = results[currentResumeIndex] || {};

  // CHANGE: Create initials for avatar display
  const getInitials = (name) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0][0] + (parts[0][1] || '')).toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Resume Screener</h1>
          <div className="flex items-center space-x-4">
            <button className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
              <Download size={16} className="mr-2" />
              Export
            </button>
            <button 
              onClick={clearAllCandidates}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <X size={16} className="mr-2" />
              Clear All
            </button>
            <button className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <a href="/"><Upload size={16} className="mr-2" />
              Upload Resumes</a>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Search and Filters Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-1/3">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
              type="text"
                placeholder="Search candidates..."
                value={filters.searchTerm}
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Filter size={16} className="mr-2 text-gray-500" />
                Filters
                <ChevronDown size={16} className={`ml-1 text-gray-500 transition-transform ${showFilters ? 'transform rotate-180' : ''}`} />
              </button>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortDirection('desc');
                }}
              >
                <option value="score">Sort by Score</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
          
          {/* Expandable Filters */}
          {showFilters && (
            <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-700">Advanced Filters</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    placeholder="Filter by position..."
                    value={filters.position}
                    onChange={(e) => setFilters({...filters, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">All Statuses</option>
                    <option value="qualified">Qualified</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Score: {filters.minScore}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minScore}
                    onChange={(e) => setFilters({...filters, minScore: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-3">
                <button 
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Reset
                </button>
                <button 
                  onClick={applyFilters}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHANGE: Only show chart if we have data */}
        {filteredResults.length > 0 ? (
          <div className="bg-white shadow-lg flex flex-col md:flex-row gap-6 rounded-xl p-6 mb-6">
            <div className='flex-1 pr-3 border-r'>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Score Graph</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="confidence" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className='flex-1 pl-3'>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Resume - {currentResume.name || `Candidate #${currentResumeIndex + 1}`}</h2>
              <p className="text-sm whitespace-pre-wrap overflow-y-auto max-h-64 border rounded p-2 bg-gray-50">
                {currentResume.resume || 'No resume content available'}
              </p>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setCurrentResumeIndex(prev => Math.max(prev - 1, 0))}
                  disabled={currentResumeIndex === 0}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentResumeIndex(prev => Math.min(prev + 1, results.length - 1))}
                  disabled={currentResumeIndex === results.length - 1}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-1 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 text-center">
            <p>No results match your filter criteria</p>
          </div>
        )}

        {/* Candidates Table */}
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer" onClick={() => toggleSort('name')}>
                      Candidate
                      <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer">
                      Position
                      <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer">
                      Contact
                      <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer" onClick={() => toggleSort('score')}>
                      Match Score
                      <ArrowUpDown size={14} className={`ml-1 ${sortBy === 'score' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center cursor-pointer">
                      Status
                      <ArrowUpDown size={14} className="ml-1 text-gray-400" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* CHANGE: Render filtered results in the table */}
                {filteredResults.length > 0 ? (
                  filteredResults.map((candidate, index) => {
                    const score = (candidate.confidence * 1.5).toFixed(2);
                    const status = getStatusFromScore(candidate.confidence);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 font-medium">{getInitials(candidate.name)}</span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{candidate.name || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">{candidate.predicted_label || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{candidate.email || 'No email'}</div>
                          <div className="text-sm text-gray-500">{candidate.phone || 'No phone'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  score > 0.7 ? 'bg-green-500' : 
                                  score > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                }`} 
                                style={{width: `${Math.min(score * 100, 100)}%`}}
                              ></div>
                            </div>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {Math.round(score * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(status)}`}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="p-1 text-blue-600 hover:text-blue-800"
                              onClick={() => viewCandidate(candidate)}
                            >
                              <Eye size={18} />
                            </button>
                            <button className="p-1 text-green-600 hover:text-green-800">
                              <UserCheck size={18} />
                            </button>
                            <button className="p-1 text-red-600 hover:text-red-800"
                            onClick={() => {
                                // Remove a specific candidate by index from the 'results' array in localStorage
                                const stored = localStorage.getItem("results");
                                if (stored) {
                                
                                  const parsed = JSON.parse(stored);   // Convert JSON string to array
                                  parsed.splice(index, 1);             // Remove 1 element at this index
                                  localStorage.setItem("results", JSON.stringify(parsed)); // Save updated list
                                  window.location.reload(); 
                                        // Refresh the page to reflect changes
                                }
                              }}>
                              <UserX size={18} />
                            </button>
                            <button className="p-1 text-gray-600 hover:text-gray-800">
                              <FileText size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No candidates match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* CHANGE: Only show pagination if we have results */}
          {filteredResults.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredResults.length}</span> of{' '}
                    <span className="font-medium">{results.length}</span> results
                  </p>
                </div>
                {/* Pagination would be implemented here if needed */}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Resume Viewer Modal */}
      {showModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Candidate Resume</h3>
              <button className="text-gray-400 hover:text-gray-500" onClick={() => setShowModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedCandidate.name || 'Unknown Candidate'}</h2>
                  <p className="text-gray-600 capitalize">{selectedCandidate.predicted_label || 'Position Unknown'}</p>
                  {selectedCandidate.email && <p className="text-gray-600">{selectedCandidate.email}</p>}
                  {selectedCandidate.phone && <p className="text-gray-600">{selectedCandidate.phone}</p>}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">Match Score</div>
                  <div className={`text-2xl font-bold ${
                    (selectedCandidate.confidence * 1.5) > 0.7 ? 'text-green-600' :
                    (selectedCandidate.confidence * 1.5) > 0.4 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {Math.round(selectedCandidate.confidence * 150)}%
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2">Resume Preview</h3>
                <div className="border border-gray-300 rounded-md p-4 bg-gray-50 min-h-[300px] whitespace-pre-wrap">
                  {selectedCandidate.resume || 'No resume content available'}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t">
              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeScreenerDashboard;