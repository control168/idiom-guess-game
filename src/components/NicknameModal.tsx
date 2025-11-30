'use client';

import { useState } from 'react';

interface NicknameModalProps {
    onSubmit: (nickname: string) => void;
}

export default function NicknameModal({ onSubmit }: NicknameModalProps) {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) {
            setError('Nickname cannot be empty');
            return;
        }

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nickname.trim() }),
            });

            if (!res.ok) {
                throw new Error('Failed to register nickname');
            }

            const user = await res.json();
            localStorage.setItem('idiom_user_id', user.id);
            localStorage.setItem('idiom_user_nickname', user.nickname);
            onSubmit(user.nickname);
        } catch (err) {
            setError('Failed to save nickname. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome!</h2>
                <p className="mb-4 text-gray-600">Please enter a nickname to track your stats.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4 text-black"
                        placeholder="Your Nickname"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
                    >
                        Start Playing
                    </button>
                </form>
            </div>
        </div>
    );
}
