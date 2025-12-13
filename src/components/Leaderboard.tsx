'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    nickname: string;
    wins: number;
    failures: number;
    successRate: number;
}

interface LeaderboardProps {
    refreshTrigger: number;
}

export default function Leaderboard({ refreshTrigger }: LeaderboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error('Failed to load leaderboard', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [refreshTrigger]);

    return (
        <div className="mt-8 w-full max-w-md bg-white p-6 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Leaderboard</h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-left border-collapse bg-white">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Player</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Success Rate</th>
                                <th className="py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">W / F</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {users.filter(user => user).map((user, index) => (
                                <tr key={user.id} className="hover:bg-purple-50 transition-colors duration-150">
                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{user.nickname}</td>
                                    <td className="py-3 px-4 text-sm text-right font-bold text-purple-600">
                                        {(!user || user.successRate == null || typeof user.successRate !== 'number') ? '0.00%' : `${user.successRate.toFixed(2)}%`}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-right text-gray-500">
                                        {user.wins} <span className="text-gray-300">/</span> {user.failures}
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500 italic">
                                        No players yet. Be the first to join the leaderboard!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
