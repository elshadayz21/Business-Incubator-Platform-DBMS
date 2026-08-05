import { useState } from 'react';

export default function SuggestedMentorsPanel({ projectId, onAssignSuccess }) {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [assigningId, setAssigningId] = useState(null);

    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Adjust the base URL if your Vite proxy isn't set up to handle /v1 directly
            const response = await fetch(`http://localhost:3000/v1/admin/projects/${projectId}/suggested-mentors?limit=5`);
            if (!response.ok) throw new Error('Failed to fetch suggested mentors');

            const data = await response.json();
            setMentors(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (mentorId) => {
        setAssigningId(mentorId);
        try {
            // Adjust this endpoint/method to match how your admin panel creates assignments
            const response = await fetch(`/v1/admin/projects/${projectId}/assign-mentor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorId })
            });

            if (!response.ok) throw new Error('Failed to assign mentor');

            // Optionally call back to the parent component to update UI state
            if (onAssignSuccess) onAssignSuccess(mentorId);

            // Remove the assigned mentor from the suggested list
            setMentors(prev => prev.filter(m => m.id !== mentorId));
        } catch (err) {
            alert(err.message);
        } finally {
            setAssigningId(null);
        }
    };

    return (
        <div className="bg-white border-4 border-black p-8 mb-8 shadow-[6px_6px_0_0_#000] mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">AI Suggested Mentors</h3>
                <button
                    onClick={fetchSuggestions}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    {loading ? 'Analyzing...' : 'Find Mentors'}
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {mentors.length > 0 && (
                <div className="space-y-4">
                    {mentors.map((mentor) => {
                        // Assuming your API returns { id, name, expertise, matchScore }
                        // matchScore is 0 to 1. Multiply by 100 for percentage.
                        const score = Math.round((mentor.matchScore || 0) * 100);

                        // Color logic for the score bar
                        const scoreColor = score > 75 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-gray-400';

                        return (
                            <div key={mentor.id} className="border border-gray-100 rounded-md p-4 hover:bg-gray-50 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium text-gray-900">{mentor.name}</p>
                                        <p className="text-sm text-gray-500">{mentor.expertise}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm font-bold text-gray-700">{score}%</span>
                                        <button
                                            onClick={() => handleAssign(mentor.id)}
                                            disabled={assigningId === mentor.id}
                                            className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {assigningId === mentor.id ? 'Assigning...' : 'Assign'}
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                    <div
                                        className={`${scoreColor} h-1.5 rounded-full transition-all duration-500`}
                                        style={{ width: `${score}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && mentors.length === 0 && !error && (
                <p className="text-sm text-gray-400 text-center py-4">
                    Click "Find Mentors" to run the TF-IDF matching algorithm.
                </p>
            )}
        </div>
    );
}