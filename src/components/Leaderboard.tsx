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
    currentNickname: string | null;
}

const AVATAR_TINTS = [
    "var(--color-avatar-1)",
    "var(--color-avatar-2)",
    "var(--color-avatar-3)",
    "var(--color-avatar-4)",
    "var(--color-avatar-5)",
];

function avatarColor(nickname: string) {
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) hash = (hash * 31 + nickname.charCodeAt(i)) >>> 0;
    return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

function rankIcon(idx: number) {
    if (idx === 0) return "1";
    if (idx === 1) return "2";
    if (idx === 2) return "3";
    return String(idx + 1);
}

export default function Leaderboard({ refreshTrigger, currentNickname }: LeaderboardProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [scope, setScope] = useState<"today" | "global">("global");

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
        <section className="rounded-2xl border border-[var(--color-border)] bg-card/80 p-6 backdrop-blur-sm">
            <header className="mb-4 flex items-baseline justify-between">
                <h2 className="font-serif text-2xl text-text-primary">Leaderboard</h2>
                <div className="flex items-center gap-1 text-[0.65rem] uppercase tracking-[0.2em]">
                    <button
                        onClick={() => setScope("today")}
                        className={`px-2 py-1 transition ${scope === "today" ? "text-accent" : "text-text-mute hover:text-text-secondary"}`}
                    >
                        today
                    </button>
                    <span className="text-text-mute">·</span>
                    <button
                        onClick={() => setScope("global")}
                        className={`px-2 py-1 transition ${scope === "global" ? "text-accent" : "text-text-mute hover:text-text-secondary"}`}
                    >
                        global
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-4 border-b border-[var(--color-border)] pb-2 text-[0.6rem] uppercase tracking-[0.2em] text-text-mute">
                        <span>#</span>
                        <span>player</span>
                        <span className="text-right">score</span>
                        <span className="text-right">hit · streak</span>
                    </div>
                    <ul className="mt-2 divide-y divide-[var(--color-border)]/40">
                        {users.filter(u => u).slice(0, 5).map((user, idx) => {
                            const isMe = currentNickname && user.nickname === currentNickname;
                            return (
                                <li
                                    key={user.id}
                                    className={`grid grid-cols-[24px_1fr_auto_auto] items-center gap-4 py-3 text-sm transition ${
                                        isMe ? "rounded-lg bg-accent-dim/50 px-2 -mx-2" : ""
                                    }`}
                                >
                                    <span className="num-mono text-text-mute">{rankIcon(idx)}</span>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[0.7rem] font-medium text-bg"
                                            style={{ background: avatarColor(user.nickname) }}
                                        >
                                            {user.nickname[0]?.toUpperCase()}
                                        </span>
                                        <span className="truncate text-text-primary">
                                            {user.nickname}
                                            {isMe && <span className="ml-1.5 num-mono text-[0.6rem] uppercase tracking-wider text-accent">you</span>}
                                        </span>
                                    </div>
                                    <span className="num-mono text-right text-text-primary">{user.wins * 10}</span>
                                    <span className="num-mono text-right text-text-secondary">
                                        {(user.successRate ?? 0).toFixed(0)}%
                                        <span className="ml-2 text-accent">{user.wins}×</span>
                                    </span>
                                </li>
                            );
                        })}
                        {users.length === 0 && (
                            <li className="py-10 text-center text-sm italic text-text-mute">
                                No players yet — be the first.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </section>
    );
}
