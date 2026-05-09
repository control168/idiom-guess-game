'use client';

import { useState, useEffect, useRef } from 'react';
import NicknameModal from './NicknameModal';
import Leaderboard from './Leaderboard';
import { HowToPlayCard, ScoringCard } from './InfoCards';

interface Idiom {
    id: number;
    clue: string;
    difficulty?: string;
    language?: string;
    phraseLength: number;
    wordLengths: number[];
    hintPrefix?: string;
}

type Lang = 'en' | 'zh' | 'word';

const DIFFICULTY_LEVEL: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

function authHeaders(): Record<string, string> {
    const t = typeof window !== 'undefined' ? localStorage.getItem('idiom_user_token') : null;
    return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function Game() {
    const [currentIdiom, setCurrentIdiom] = useState<Idiom | null>(null);
    const [revealedPhrase, setRevealedPhrase] = useState<string | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [wins, setWins] = useState(0);
    const [losses, setLosses] = useState(0);
    const [round, setRound] = useState(1);
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'hint' } | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [usedHint, setUsedHint] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shaking, setShaking] = useState(false);
    const [language, setLanguage] = useState<Lang>('en');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [nickname, setNickname] = useState<string | null>(null);
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
    const [mounted, setMounted] = useState(false);

    const successAudio = useRef<HTMLAudioElement | null>(null);
    const errorAudio = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        setMounted(true);
        const savedScore = localStorage.getItem('idiom_score');
        const savedStreak = localStorage.getItem('idiom_streak');
        const savedBest = localStorage.getItem('idiom_best_streak');
        const savedWins = localStorage.getItem('idiom_wins');
        const savedLosses = localStorage.getItem('idiom_losses');
        const savedNickname = localStorage.getItem('idiom_user_nickname');
        const savedToken = localStorage.getItem('idiom_user_token');

        if (savedScore) setScore(parseInt(savedScore));
        if (savedStreak) setStreak(parseInt(savedStreak));
        if (savedBest) setBestStreak(parseInt(savedBest));
        if (savedWins) setWins(parseInt(savedWins));
        if (savedLosses) setLosses(parseInt(savedLosses));

        if (savedNickname && savedToken) {
            setNickname(savedNickname);
        } else if (savedNickname && !savedToken) {
            // Existing user from a pre-token deploy — refresh token transparently
            void refreshToken(savedNickname);
        } else {
            setShowNicknameModal(true);
        }

        loadNewIdiom('en');
    }, []);

    useEffect(() => {
        localStorage.setItem('idiom_score', score.toString());
        localStorage.setItem('idiom_streak', streak.toString());
        localStorage.setItem('idiom_best_streak', bestStreak.toString());
        localStorage.setItem('idiom_wins', wins.toString());
        localStorage.setItem('idiom_losses', losses.toString());
    }, [score, streak, bestStreak, wins, losses]);

    const refreshToken = async (nick: string) => {
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: nick }),
            });
            if (res.ok) {
                const u = await res.json();
                localStorage.setItem('idiom_user_id', u.id);
                localStorage.setItem('idiom_user_nickname', u.nickname);
                if (u.token) localStorage.setItem('idiom_user_token', u.token);
                setNickname(u.nickname);
            } else {
                localStorage.removeItem('idiom_user_id');
                localStorage.removeItem('idiom_user_nickname');
                localStorage.removeItem('idiom_user_token');
                setShowNicknameModal(true);
            }
        } catch {
            setShowNicknameModal(true);
        }
    };

    const playSound = (kind: 'success' | 'error') => {
        const ref = kind === 'success' ? successAudio.current : errorAudio.current;
        if (!ref) return;
        ref.currentTime = 0;
        ref.play().catch(() => { /* autoplay block — silent */ });
    };

    const handleAuthFailure = () => {
        localStorage.removeItem('idiom_user_token');
        setShowNicknameModal(true);
        setMessage({ text: "Session expired. Please re-enter your nickname.", type: 'error' });
    };

    const loadNewIdiom = async (lang: Lang = language) => {
        setLoading(true);
        setMessage(null);
        setRevealed(false);
        setRevealedPhrase(null);
        setUsedHint(false);
        setGuess('');
        setFailedAttempts(0);
        try {
            const res = await fetch(`/api/idioms?lang=${lang}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setCurrentIdiom(data);
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Failed to load. Please refresh.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: Lang) => {
        if (lang === language) return;
        setLanguage(lang);
        loadNewIdiom(lang);
        setStreak(0);
    };

    const handleGuess = async (raw?: string) => {
        if (!currentIdiom || revealed) return;
        const userGuess = (raw ?? guess).trim();
        if (!userGuess) return;

        try {
            const res = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ idiomId: currentIdiom.id, guess: userGuess }),
            });

            if (res.status === 401) { handleAuthFailure(); return; }
            if (!res.ok) {
                setMessage({ text: 'Server error. Try again.', type: 'error' });
                return;
            }

            const data = await res.json() as { correct: boolean; phrase: string | null };
            if (data.correct && data.phrase) {
                handleWin(data.phrase);
            } else {
                handleLoss();
            }
        } catch {
            setMessage({ text: 'Network error. Try again.', type: 'error' });
        }
    };

    const handleWin = (phrase: string) => {
        const lvl = DIFFICULTY_LEVEL[currentIdiom?.difficulty ?? 'medium'] ?? 2;
        const cleanBonus = !usedHint ? 5 : 0;
        const earned = 10 + lvl * 5 + cleanBonus + streak * 2;
        const newStreak = streak + 1;
        setMessage({ text: `+${earned} ${cleanBonus ? "· clean +5" : ""}`, type: 'success' });
        setScore(s => s + earned);
        setStreak(newStreak);
        setBestStreak(b => Math.max(b, newStreak));
        setWins(w => w + 1);
        setRevealed(true);
        setRevealedPhrase(phrase);
        setGuess(phrase);
        playSound('success');
        setLeaderboardRefresh(prev => prev + 1);
    };

    const handleLoss = () => {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        setStreak(0);
        setLosses(l => l + 1);
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        playSound('error');

        if (newFailedAttempts === 5 && currentIdiom?.hintPrefix) {
            const hp = currentIdiom.hintPrefix;
            const text = language === 'zh'
                ? `提示：開頭「${hp}」`
                : `Hint: starts with "${language === 'word' ? hp.toUpperCase() : hp}"`;
            setMessage({ text, type: 'hint' });
        } else {
            setMessage({ text: language === 'zh' ? "再試一次。" : "Not quite — try again.", type: 'error' });
        }
    };

    const handleHint = () => {
        if (!currentIdiom?.hintPrefix || revealed) return;
        setUsedHint(true);
        const hp = currentIdiom.hintPrefix;
        const text = language === 'zh'
            ? `提示：第一個字「${hp}」`
            : `Hint: starts with "${language === 'word' ? hp.toUpperCase() : hp}"`;
        setMessage({ text, type: 'hint' });
        setScore(s => Math.max(0, s - 2));
    };

    const handleReveal = async () => {
        if (!currentIdiom || revealed) return;
        try {
            const res = await fetch('/api/reveal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ idiomId: currentIdiom.id }),
            });
            if (res.status === 401) { handleAuthFailure(); return; }
            if (!res.ok) {
                setMessage({ text: 'Server error. Try again.', type: 'error' });
                return;
            }
            const data = await res.json() as { phrase: string };
            setGuess(data.phrase);
            setRevealedPhrase(data.phrase);
            setRevealed(true);
            setStreak(0);
            setLosses(l => l + 1);
            setLeaderboardRefresh(prev => prev + 1);
            setMessage({ text: `${language === 'zh' ? "答案：" : "Answer:"} ${data.phrase}`, type: 'hint' });
        } catch {
            setMessage({ text: 'Network error. Try again.', type: 'error' });
        }
    };

    const handleSkip = () => {
        setStreak(0);
        setRound(r => r + 1);
        loadNewIdiom();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') void handleGuess();
    };

    const handleNicknameSubmit = (newNickname: string) => {
        setNickname(newNickname);
        setShowNicknameModal(false);
    };

    if (!mounted) return null;

    const total = wins + losses;
    const acc = total > 0 ? Math.round((wins / total) * 100) : 0;
    const difficultyKey = (currentIdiom?.difficulty ?? 'medium') as 'easy' | 'medium' | 'hard';
    const difficultyLevel = DIFFICULTY_LEVEL[difficultyKey] ?? 2;
    const isWord = language === 'word';

    return (
        <div className="mx-auto max-w-7xl">
            <audio ref={successAudio} src="/correct.mp3" preload="auto" />
            <audio ref={errorAudio} src="/oops.mp3" preload="auto" />

            {showNicknameModal && <NicknameModal onSubmit={handleNicknameSubmit} />}

            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <Brand />
                <LangToggle language={language} onChange={handleLanguageChange} />
                <StatPills score={score} acc={acc} bestStreak={bestStreak} />
            </header>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3 num-mono text-[0.7rem] uppercase tracking-[0.2em] text-text-mute">
                <div className="flex items-center gap-4">
                    <span>round № <span className="text-text-secondary">{String(round).padStart(2, '0')}</span></span>
                    {nickname && <span>· playing as <span className="text-text-primary normal-case tracking-normal font-sans">{nickname}</span></span>}
                </div>
                <StreakStars streak={streak} />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="flex flex-col gap-4">
                    <article className="relative overflow-hidden rounded-3xl border border-[var(--color-border-strong)] bg-card p-8 lg:p-10 animate-fade-in-up">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-text-secondary">
                                    {language === 'en' ? 'English' : language === 'zh' ? '中文' : '5-Letter'}
                                </span>
                                <span className="text-text-mute">·</span>
                                <DifficultyMeter level={difficultyLevel} label={difficultyKey} />
                            </div>
                            <span className="label-caps">{isWord ? 'word' : 'idiom'}</span>
                        </div>

                        <div className="relative mt-10 mb-10">
                            <span className="absolute -left-2 -top-4 font-serif text-6xl leading-none text-accent/70 select-none">&ldquo;</span>
                            <p className="px-6 font-serif text-3xl leading-snug text-text-primary lg:text-4xl">
                                {loading ? <span className="text-text-mute italic">loading…</span> : currentIdiom?.clue}
                            </p>
                            <span className="absolute -right-2 bottom-0 font-serif text-6xl leading-none text-accent/70 select-none">&rdquo;</span>
                        </div>

                        {!isWord && (
                            <div className="border-t border-dashed border-[var(--color-border)] pt-6">
                                <LetterSlots idiom={currentIdiom} language={language} revealed={revealed} revealedPhrase={revealedPhrase} />
                            </div>
                        )}
                    </article>

                    {isWord ? (
                        <WordSlotInput
                            length={5}
                            value={guess}
                            disabled={revealed}
                            shaking={shaking}
                            revealed={revealed}
                            answer={revealedPhrase ?? undefined}
                            onChange={setGuess}
                            onSubmit={(v) => void handleGuess(v)}
                            onNext={() => { setRound(r => r + 1); loadNewIdiom(); }}
                        />
                    ) : (
                        <div className={`grid grid-cols-[auto_1fr_auto] items-stretch gap-3 ${shaking ? 'animate-shake' : ''}`}>
                            <div className="flex items-center px-4 label-caps">guess</div>
                            <input
                                type="text"
                                placeholder={language === 'en' ? "Type the idiom…" : "輸入成語…"}
                                autoComplete="off"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={revealed}
                                className="w-full rounded-2xl border border-[var(--color-border)] bg-card px-5 py-4 font-serif text-xl text-text-primary placeholder:text-text-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition disabled:opacity-60"
                            />
                            {revealed ? (
                                <button
                                    onClick={() => { setRound(r => r + 1); loadNewIdiom(); }}
                                    className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-medium text-bg transition hover:bg-accent-soft"
                                >
                                    Next <span className="num-mono text-sm">→</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => void handleGuess()}
                                    disabled={!guess.trim()}
                                    className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-medium text-bg transition hover:bg-accent-soft disabled:opacity-40 disabled:hover:bg-accent"
                                >
                                    Submit <kbd className="rounded bg-bg/30 px-1.5 py-0.5 num-mono text-xs">↵</kbd>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                        <ActionPill label="Hint" active={usedHint} disabled={revealed} onClick={handleHint} />
                        <ActionPill label="Reveal" disabled={revealed} onClick={() => void handleReveal()} />
                        <ActionPill label="Skip →" onClick={handleSkip} />
                    </div>

                    {message && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm animate-pop-in ${
                                message.type === 'success'
                                    ? 'border-success/30 bg-success/10 text-success'
                                    : message.type === 'error'
                                        ? 'border-error/30 bg-error/10 text-error'
                                        : 'border-accent/30 bg-accent-dim text-accent'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}
                </div>

                <aside className="flex flex-col gap-4">
                    <HowToPlayCard />
                    <ScoringCard />
                    <Leaderboard refreshTrigger={leaderboardRefresh} currentNickname={nickname} />
                </aside>
            </div>
        </div>
    );
}

/* ---------- Sub-components ---------- */

function Brand() {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-serif text-2xl italic text-bg">
                i
            </span>
            <div>
                <h1 className="font-serif text-2xl italic leading-none text-text-primary">Idiomatica</h1>
                <p className="mt-1 label-caps">A Daily Idiom Game</p>
            </div>
        </div>
    );
}

function LangToggle({ language, onChange }: { language: Lang; onChange: (l: Lang) => void }) {
    const opts: { key: Lang; primary: string; secondary: string }[] = [
        { key: 'en', primary: 'EN', secondary: 'English' },
        { key: 'zh', primary: '中文', secondary: 'Chéngyǔ' },
        { key: 'word', primary: '5L', secondary: 'Word' },
    ];

    return (
        <div className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-card/80 p-1.5 backdrop-blur-sm">
            {opts.map((o) => {
                const active = language === o.key;
                return (
                    <button
                        key={o.key}
                        onClick={() => onChange(o.key)}
                        className={`rounded-full px-4 py-2 text-center transition ${
                            active ? 'bg-bg text-text-primary shadow-inner' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        <span className={`block text-base leading-none ${active ? 'text-accent' : 'text-text-secondary'} ${o.key === 'zh' ? 'font-serif' : 'num-mono uppercase tracking-[0.15em] text-[0.7rem]'}`}>
                            {o.primary}
                        </span>
                        <span className="block label-caps mt-0.5 text-[0.6rem]">{o.secondary}</span>
                    </button>
                );
            })}
        </div>
    );
}

function StatPills({ score, acc, bestStreak }: { score: number; acc: number; bestStreak: number }) {
    return (
        <div className="flex items-center gap-2">
            <Pill label="score" value={String(score)} />
            <Pill label="acc" value={`${acc}%`} />
            <Pill label="best" value={`${bestStreak}×`} />
        </div>
    );
}

function Pill({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2 rounded-xl border border-[var(--color-border-strong)] bg-card/80 px-3 py-2 backdrop-blur-sm">
            <span className="label-caps">{label}</span>
            <span className="num-mono text-base text-text-primary">{value}</span>
        </div>
    );
}

function StreakStars({ streak }: { streak: number }) {
    const max = 5;
    return (
        <div className="flex items-center gap-2">
            <span>streak</span>
            <span className="tracking-[0.2em] text-accent">
                {Array.from({ length: max }).map((_, i) => (
                    <span key={i}>{i < streak ? '★' : '☆'}</span>
                ))}
            </span>
            {streak > max && <span className="num-mono text-accent">+{streak - max}</span>}
        </div>
    );
}

function DifficultyMeter({ level, label }: { level: number; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
                {[1, 2, 3].map((i) => (
                    <span
                        key={i}
                        className={`h-3 w-1.5 rounded-sm ${i <= level ? 'bg-accent' : 'bg-text-mute/40'}`}
                    />
                ))}
            </div>
            <span className="label-caps">{label}</span>
        </div>
    );
}

function LetterSlots({
    idiom,
    language,
    revealed,
    revealedPhrase,
}: {
    idiom: Idiom | null;
    language: Lang;
    revealed: boolean;
    revealedPhrase: string | null;
}) {
    if (!idiom) return <div className="h-12" />;

    if (language === 'en') {
        const wordLengths = idiom.wordLengths ?? [];
        const revealedWords = revealed && revealedPhrase ? revealedPhrase.split(' ') : [];
        return (
            <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-4">
                {wordLengths.map((len, wi) => (
                    <div key={wi} className="flex flex-col items-center gap-2">
                        <div className="flex gap-1.5">
                            {Array.from({ length: len }).map((_, ci) => (
                                <span
                                    key={ci}
                                    className={`flex h-8 w-6 items-end justify-center border-b font-serif text-lg transition ${
                                        revealed
                                            ? 'border-accent text-accent'
                                            : 'border-text-mute text-text-primary'
                                    }`}
                                >
                                    {revealed ? (revealedWords[wi]?.[ci] ?? '') : ''}
                                </span>
                            ))}
                        </div>
                        <span className="num-mono text-[0.7rem] text-text-mute">{len}</span>
                    </div>
                ))}
            </div>
        );
    }

    // zh: render fixed-width character slots; revealedPhrase fills them on reveal
    const length = idiom.phraseLength ?? 4;
    return (
        <div className="flex flex-wrap items-end justify-center gap-2">
            {Array.from({ length }).map((_, i) => (
                <span
                    key={i}
                    className={`flex h-12 w-12 items-center justify-center rounded-md border font-serif text-2xl transition ${
                        revealed
                            ? 'border-accent bg-accent-dim text-accent'
                            : 'border-text-mute/60 text-text-primary'
                    }`}
                >
                    {revealed ? (revealedPhrase?.[i] ?? '') : ''}
                </span>
            ))}
        </div>
    );
}

function WordSlotInput({
    length,
    value,
    disabled,
    shaking,
    revealed,
    answer,
    onChange,
    onSubmit,
    onNext,
}: {
    length: number;
    value: string;
    disabled: boolean;
    shaking: boolean;
    revealed: boolean;
    answer?: string;
    onChange: (v: string) => void;
    onSubmit: (v?: string) => void;
    onNext: () => void;
}) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const display = revealed && answer
        ? answer.toUpperCase().padEnd(length, ' ').slice(0, length)
        : value.toUpperCase().padEnd(length, ' ').slice(0, length);

    const handleSlotChange = (idx: number, raw: string) => {
        const ch = raw.replace(/[^a-zA-Z]/g, '').slice(-1);
        const arr = display.split('');
        arr[idx] = ch;
        const next = arr.join('').trimEnd();
        onChange(next);
        if (ch && idx < length - 1) refs.current[idx + 1]?.focus();
        if (ch && idx === length - 1 && next.replace(/\s/g, '').length === length) {
            onSubmit(next);
        }
    };

    const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !display[idx].trim() && idx > 0) {
            refs.current[idx - 1]?.focus();
        } else if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                <span className="px-4 label-caps">guess</span>
                <div className={`flex justify-center gap-2 ${shaking ? 'animate-shake' : ''}`}>
                    {Array.from({ length }).map((_, i) => {
                        const ch = display[i] === ' ' ? '' : display[i];
                        return (
                            <input
                                key={i}
                                ref={(el) => { refs.current[i] = el; }}
                                type="text"
                                maxLength={1}
                                value={ch}
                                onChange={(e) => handleSlotChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                disabled={disabled}
                                className={`h-14 w-14 rounded-xl border-2 text-center font-serif text-2xl uppercase transition focus:outline-none ${
                                    revealed
                                        ? 'border-accent bg-accent-dim text-accent'
                                        : 'border-[var(--color-border-strong)] bg-card text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20'
                                }`}
                            />
                        );
                    })}
                </div>
                {revealed ? (
                    <button
                        onClick={onNext}
                        className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-medium text-bg transition hover:bg-accent-soft"
                    >
                        Next <span className="num-mono text-sm">→</span>
                    </button>
                ) : (
                    <button
                        onClick={() => onSubmit()}
                        disabled={value.replace(/\s/g, '').length < length}
                        className="flex items-center gap-2 rounded-2xl bg-accent px-6 py-4 font-medium text-bg transition hover:bg-accent-soft disabled:opacity-40 disabled:hover:bg-accent"
                    >
                        Submit <kbd className="rounded bg-bg/30 px-1.5 py-0.5 num-mono text-xs">↵</kbd>
                    </button>
                )}
            </div>
        </div>
    );
}

function ActionPill({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                active
                    ? 'border-accent bg-accent-dim text-accent'
                    : 'border-[var(--color-border-strong)] bg-card/60 text-text-secondary hover:border-accent/40 hover:text-text-primary'
            } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--color-border-strong)] disabled:hover:text-text-secondary`}
        >
            {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            {label}
        </button>
    );
}
