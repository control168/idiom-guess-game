'use client';

import { useState } from 'react';

interface NicknameModalProps {
    onSubmit: (nickname: string) => void;
}

export default function NicknameModal({ onSubmit }: NicknameModalProps) {
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = nickname.trim();
        if (!trimmed) {
            setError('Nickname cannot be empty');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: trimmed }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body?.error || 'Failed to register nickname');
            }

            const user = await res.json();
            localStorage.setItem('idiom_user_id', user.id);
            localStorage.setItem('idiom_user_nickname', user.nickname);
            if (user.token) localStorage.setItem('idiom_user_token', user.token);
            onSubmit(user.nickname);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save nickname.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-3xl border border-[var(--color-border-strong)] bg-card p-8 shadow-2xl animate-fade-in-up">
                <span className="label-caps">welcome</span>
                <h2 className="mt-2 font-serif text-4xl text-text-primary">Choose a handle</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Track your streak, climb the leaderboard. 1–20 letters, numbers, spaces, _ or -.
                </p>
                <form onSubmit={handleSubmit} className="mt-6">
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border-strong)] bg-bg-soft px-4 py-3 font-serif text-xl text-text-primary placeholder:text-text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 transition"
                        placeholder="your nickname"
                        autoFocus
                        maxLength={20}
                    />
                    {error && <p className="mt-3 text-sm text-error">{error}</p>}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-6 w-full rounded-xl bg-accent px-4 py-3 font-medium text-bg transition hover:bg-accent-soft disabled:opacity-60"
                    >
                        {submitting ? "Saving…" : "Start playing →"}
                    </button>
                </form>
            </div>
        </div>
    );
}
