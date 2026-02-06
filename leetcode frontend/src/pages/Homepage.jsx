import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import { logoutUser } from '../authSlice';

function Homepage() {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [problems, setProblems] = useState([]);
    const [solvedProblems, setSolvedProblems] = useState([]);
    const [filters, setFilters] = useState({
        difficulty: 'all',
        tag: 'all',
        status: 'all'
    });

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const { data } = await axiosClient.get('/problem/all');
                setProblems(data);
            } catch (error) {
                console.error('Error fetching Problems:', error);
            }
        };

        const fetchSolvedProblems = async () => {
            try {
                const { data } = await axiosClient.get("/problem/solved-by-user");
                setSolvedProblems(data);
            } catch (err) {
                console.error('Error fetching solved problems:', err);
            }
        };
        
        fetchProblems();
        if (user) fetchSolvedProblems();
    }, [user]);

    const handleLogout = () => {
        dispatch(logoutUser());
        setSolvedProblems([]);
    };

    const filteredProblems = problems.filter(problem => {
        const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
        const tagMatch = filters.tag === 'all' || problem.tags?.includes(filters.tag);
        let statusMatch = true;
        
        if (filters.status === 'solved') {
            statusMatch = solvedProblems.some(sp => sp._id === problem._id);
        } else if (filters.status === 'unsolved') {
            statusMatch = !solvedProblems.some(sp => sp._id === problem._id);
        }
        
        return difficultyMatch && tagMatch && statusMatch;
    });

    const getDifficultyColor = (difficulty) => {
        if (!difficulty) return '';
        
        // All difficulties use dark green theme
        return 'text-white bg-green-700 border-green-800 font-bold';
    };

    const getTagColor = (tag) => {
        if (!tag) return 'badge-neutral';
        
        const tagLower = tag.toLowerCase();
        const tagColors = {
            // Array - Blue
            'array': 'text-white bg-blue-600 border-blue-700',
            
            // Hash Table - Green
            'hash-table': 'text-white bg-green-600 border-green-700',
            'hashtable': 'text-white bg-green-600 border-green-700',
            
            // Linked List - Purple
            'linkedlist': 'text-white bg-purple-600 border-purple-700',
            'linked list': 'text-white bg-purple-600 border-purple-700',
            
            // Two Pointers - Teal
            'two-pointers': 'text-white bg-teal-600 border-teal-700',
            'two pointers': 'text-white bg-teal-600 border-teal-700',
            
            // String - Orange
            'string': 'text-white bg-orange-600 border-orange-700',
            
            // Tree - Pink
            'tree': 'text-white bg-pink-600 border-pink-700',
            
            // Graph - Red
            'graph': 'text-white bg-red-600 border-red-700',
            
            // Dynamic Programming - Indigo
            'dp': 'text-white bg-indigo-600 border-indigo-700',
            'dynamic programming': 'text-white bg-indigo-600 border-indigo-700',
            
            // Math - Blue
            'math': 'text-white bg-blue-600 border-blue-700',
            'mathematics': 'text-white bg-blue-600 border-blue-700',
            
            // Implementation - Green
            'implementation': 'text-white bg-green-600 border-green-700',
            
            // Binary Search - Purple
            'binary search': 'text-white bg-purple-600 border-purple-700',
            
            // Stack - Yellow
            'stack': 'text-white bg-yellow-600 border-yellow-700',
            
            // Queue - Orange
            'queue': 'text-white bg-orange-600 border-orange-700',
            
            // Sorting - Pink
            'sorting': 'text-white bg-pink-600 border-pink-700',
            
            // Recursion - Teal
            'recursion': 'text-white bg-teal-600 border-teal-700',
            
            // Greedy - Blue
            'greedy': 'text-white bg-blue-600 border-blue-700',
            
            // Bit Manipulation - Indigo
            'bit manipulation': 'text-white bg-indigo-600 border-indigo-700',
        };
        
        return tagColors[tagLower] || 'text-white bg-gray-600 border-gray-700';
    };

    const formatDifficulty = (difficulty) => {
        if (!difficulty) return '';
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
    };

    // Function to get difficulty based on problem (only Easy and Medium)
    const getProblemDifficulty = (problem, index) => {
        // If difficulty exists in problem data, use it
        if (problem.difficulty) {
            return problem.difficulty;
        }
        
        // Assign difficulties based on problem index for demo (only Easy and Medium)
        const difficulties = ['Easy', 'Medium'];
        return difficulties[index % 2]; // This will give pattern: Easy, Medium, Easy, Medium, etc.
    };

    return (
        <div className="min-h-screen bg-base-200">
            {/* Navigation bar */}
            <nav className="navbar bg-base-100 shadow-lg px-6 py-4">
                <div className="flex-1">
                    <NavLink to="/" className="btn btn-ghost text-2xl font-bold text-blue-600">
                        <span className="text-blue-600">CodeForge</span>
                    </NavLink>
                </div>
                
                {/* User dropdown in top right corner */}
                <div className="flex-none gap-2">
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                            <div className="w-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg">
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                        </div>
                        <ul tabIndex={0} className="mt-3 z-50 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                            <li className="p-3 border-b border-base-300">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-base">{user?.firstName} {user?.lastName}</span>
                                    <span className="text-sm text-gray-500">{user?.email}</span>
                                </div>
                            </li>
                            <li>
                                <button 
                                    onClick={handleLogout} 
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600 py-2 px-3 rounded flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                    </svg>
                                    Logout
                                </button>
                            </li>
                            {user?.role === 'admin' && (
    <li>
        <NavLink
            to="/admin"
            className="hover:bg-blue-50 hover:text-blue-600 py-2 px-3 rounded flex items-center gap-2"
        >
            {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4M12 3l9 4.5-9 4.5L3 7.5 12 3z" />
            </svg> */}
            Admin Panel
        </NavLink>
    </li>
)}
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Main content */}
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">All Problems</h1>
                        <p className="text-gray-600">Practice coding problems to improve your skills</p>
                    </div>
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Total Problems</div>
                            <div className="stat-value text-primary">{problems.length}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Solved</div>
                            <div className="stat-value text-success">{solvedProblems.length}</div>
                        </div>
                        <div className="stat">
                            <div className="stat-title">Accuracy</div>
                            <div className="stat-value">
                                {problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8 bg-base-100 p-6 rounded-xl shadow">
                    <div className="form-control w-full md:w-auto">
                        <label className="label">
                            <span className="label-text font-semibold">Status</span>
                        </label>
                        <select
                            className="select select-bordered w-full md:w-48"
                            value={filters.status}
                            onChange={(e) => setFilters({...filters, status: e.target.value})}
                        >
                            <option value="all">All Problems</option>
                            <option value="solved">Solved</option>
                            <option value="unsolved">Unsolved</option>
                        </select>
                    </div>
                    
                    <div className="form-control w-full md:w-auto">
                        <label className="label">
                            <span className="label-text font-semibold">Difficulty</span>
                        </label>
                        <select
                            className="select select-bordered w-full md:w-48"
                            value={filters.difficulty}
                            onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
                        >
                            <option value="all">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                        </select>
                    </div>
                    
                    <div className="form-control w-full md:w-auto">
                        <label className="label">
                            <span className="label-text font-semibold">Tags</span>
                        </label>
                        <select
                            className="select select-bordered w-full md:w-48"
                            value={filters.tag}
                            onChange={(e) => setFilters({ ...filters, tag: e.target.value})}
                        >
                            <option value="all">All Tags</option>
                            <option value="array">Array</option>
                            <option value="hash-table">Hash Table</option>
                            <option value="linkedlist">Linked List</option>
                            <option value="two-pointers">Two Pointers</option>
                            <option value="string">String</option>
                            <option value="tree">Tree</option>
                            <option value="graph">Graph</option>
                            <option value="dp">Dynamic Programming</option>
                            <option value="math">Math</option>
                            <option value="implementation">Implementation</option>
                        </select>
                    </div>
                    
                    <div className="form-control w-full md:w-auto flex items-end">
                        <button 
                            className="btn btn-outline btn-error"
                            onClick={() => setFilters({ difficulty: 'all', tag: 'all', status: 'all' })}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>

                {/* Problem list - Table view */}
                <div className="bg-base-100 rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr className="bg-base-200">
                                    <th className="w-16 text-center">Status</th>
                                    <th className="w-12">#</th>
                                    <th>Title</th>
                                    <th className="w-32">Difficulty</th>
                                    <th className="w-64">Tags</th>
                                    <th className="w-32 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProblems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <h3 className="text-xl font-semibold text-gray-700 mb-2">No problems found</h3>
                                                <p className="text-gray-500">Try changing your filters or check back later</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProblems.map((problem, index) => {
                                        const isSolved = solvedProblems.some(sp => sp._id === problem._id);
                                        const difficulty = getProblemDifficulty(problem, index);
                                        
                                        return (
                                            <tr key={problem._id} className="hover:bg-base-100 border-b border-base-200">
                                                <td className="text-center">
                                                    {isSolved ? (
                                                        <div className="badge badge-success badge-lg p-3" title="Solved">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="badge badge-ghost badge-lg p-3 opacity-50" title="Not solved">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="text-gray-500 font-mono">{index + 1}</span>
                                                </td>
                                                <td>
                                                    <NavLink 
                                                        to={`/problem/${problem._id}`}
                                                        className="flex items-center gap-3 hover:no-underline"
                                                    >
                                                        <div>
                                                            <div className="font-bold text-lg text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                                                                {problem.title}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                Acceptance: {problem.acceptanceRate || 'N/A'}%
                                                            </div>
                                                        </div>
                                                        {problem.isPremium && (
                                                            <span className="badge badge-primary badge-sm">Premium</span>
                                                        )}
                                                    </NavLink>
                                                </td>
                                                {/* Difficulty Column - Now shows only Easy and Medium in pattern */}
                                                <td>
                                                    <span className={`badge font-semibold px-3 py-2 ${getDifficultyColor(difficulty)}`}>
                                                        {formatDifficulty(difficulty)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex flex-wrap gap-1">
                                                        {problem.tags?.slice(0, 3).map((tag, tagIndex) => (
                                                            <span key={tagIndex} className={`badge badge-sm font-medium ${getTagColor(tag)}`}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {problem.tags?.length > 3 && (
                                                            <span className="badge badge-neutral badge-sm">
                                                                +{problem.tags.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <NavLink 
                                                        to={`/problem/${problem._id}`}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        Solve
                                                    </NavLink>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {filteredProblems.length > 0 && (
                    <div className="flex justify-between items-center mt-8">
                        <div className="text-sm text-gray-600">
                            Showing {Math.min(filteredProblems.length, 10)} of {filteredProblems.length} problems
                        </div>
                        <div className="btn-group">
                            <button className="btn btn-outline">«</button>
                            <button className="btn btn-outline btn-active">1</button>
                            <button className="btn btn-outline">2</button>
                            <button className="btn btn-outline">3</button>
                            <button className="btn btn-outline">4</button>
                            <button className="btn btn-outline">»</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="footer footer-center p-10 bg-base-300 text-base-content mt-12">
                <div>
                    <NavLink to="/" className="btn btn-ghost text-xl font-bold text-blue-600">CodeForge</NavLink>
                    <p className="font-medium">
                        Level up your coding skills and ace the interview
                    </p>
                    {/* <p>Copyright © {new Date().getFullYear()} - All rights reserved</p> */}
                </div>
            </footer>
        </div>
    );
}

export default Homepage;