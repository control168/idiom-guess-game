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
                <p className="text-center text-gray-600">Loading...</p>
            ) : (
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b">
                            <th className="pb-2 text-gray-600">Rank</th>
                            <th className="pb-2 text-gray-600">Player</th>
                            <th className="pb-2 text-gray-600 text-right">Rate</th>
                            <th className="pb-2 text-gray-600 text-right">W/F</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(user => user).map((user, index) => (
                            <tr key={user.id} className="border-b last:border-0">
                                <td className="py-3 text-gray-800 font-medium">#{index + 1}</td>
                                <td className="py-3 text-gray-800">{user.nickname}</td>
                                <td className="py-3 text-right text-purple-600 font-bold">
                                    {(!user || user.successRate == null || typeof user.successRate !== 'number') ? '0.00%' : `${user.successRate.toFixed(2)}%`}
                                </td>
                                <td className="py-3 text-right text-gray-500 text-sm">
                                    {user.wins}/{user.failures}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-4 text-gray-500">
                                    No players yet. Be the first!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}
