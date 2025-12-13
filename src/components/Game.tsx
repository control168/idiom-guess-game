'use client';

import { useState, useEffect } from 'react';
import NicknameModal from './NicknameModal';
import Leaderboard from './Leaderboard';

interface Idiom {
    id: number;
    phrase: string;
    clue: string;
    meaning: string;
}

export default function Game() {
    const [currentIdiom, setCurrentIdiom] = useState<Idiom | null>(null);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [guess, setGuess] = useState('');
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [revealed, setRevealed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [shaking, setShaking] = useState(false);
    const [language, setLanguage] = useState<'en' | 'zh'>('en');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [showNicknameModal, setShowNicknameModal] = useState(false);
    const [nickname, setNickname] = useState<string | null>(null);
    const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);
    const [mounted, setMounted] = useState(false);


    // Load score and user info from local storage on mount
    useEffect(() => {
        setMounted(true);
        const savedScore = localStorage.getItem('idiom_score');
        const savedStreak = localStorage.getItem('idiom_streak');
        const savedNickname = localStorage.getItem('idiom_user_nickname');

        if (savedScore) setScore(parseInt(savedScore));
        if (savedStreak) setStreak(parseInt(savedStreak));

        if (savedNickname) {
            setNickname(savedNickname);
        } else {
            setShowNicknameModal(true);
        }

        loadNewIdiom('en'); // Default to English initially
    }, []);

    // Save score to local storage
    useEffect(() => {
        localStorage.setItem('idiom_score', score.toString());
        localStorage.setItem('idiom_streak', streak.toString());
    }, [score, streak]);

    const updateUserStats = async (action: 'win' | 'loss') => {
        const userId = localStorage.getItem('idiom_user_id');
        if (!userId) return;

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, action }),
            });

            if (res.status === 404) {
                // User not found in DB (e.g., db reset), prompt to re-register
                localStorage.removeItem('idiom_user_id');
                localStorage.removeItem('idiom_user_nickname');
                setNickname(null);
                setShowNicknameModal(true);
                setMessage({ text: "Session expired. Please enter your nickname again.", type: 'error' });
            }
        } catch (error) {
            console.error('Failed to update stats', error);
        }
    };

    const loadNewIdiom = async (lang: 'en' | 'zh' = language) => {
        setLoading(true);
        setMessage(null);
        setRevealed(false);
        setGuess(''); // Reset guess
        setFailedAttempts(0);
        try {
            const res = await fetch(`/api/idioms?lang=${lang}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setCurrentIdiom(data);

            setGuess('');
        } catch (error) {
            console.error(error);
            setMessage({ text: 'Failed to load idiom. Please try refreshing.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (lang: 'en' | 'zh') => {
        if (lang === language) return;
        setLanguage(lang);
        loadNewIdiom(lang);
        setStreak(0);
        setScore(0);
    };

    const handleGuess = () => {
        if (!currentIdiom || revealed) return;

        const userGuess = guess.trim().toLowerCase();
        const correctPhrase = currentIdiom.phrase.toLowerCase();

        if (userGuess === correctPhrase) {
            handleWin();
        } else {
            handleLoss();
        }
    };

    const handleWin = () => {
        setMessage({ text: "Correct! You're a genius! 🎉", type: 'success' });
        setScore(s => s + 10 + (streak * 2));
        setStreak(s => s + 1);
        setRevealed(true);
        updateUserStats('win');
        setLeaderboardRefresh(prev => prev + 1);
    };

    const handleLoss = () => {
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        setStreak(0);
        setShaking(true);
        setTimeout(() => setShaking(false), 500);

        if (newFailedAttempts === 5 && currentIdiom) {
            let hintText = "";
            if (language === 'en') {
                const words = currentIdiom.phrase.split(' ');
                const hintWords = words.slice(0, 2).join(' ');
                hintText = `Hint: The first 2 words are "${hintWords}"`;
            } else {
                const hintChars = currentIdiom.phrase.substring(0, 2);
                hintText = `Hint: The first 2 characters are "${hintChars}"`;
            }
            setMessage({ text: hintText, type: 'success' });
        } else {
            setMessage({ text: "Not quite! Try again.", type: 'error' });
        }
    };

    const handleHint = () => {
        if (!currentIdiom || revealed) return;

        if (language === 'en') {
            const firstWord = currentIdiom.phrase.split(' ')[0];
            setMessage({ text: `Hint: Starts with "${firstWord}"`, type: 'success' });
        } else {
            const firstChar = currentIdiom.phrase[0];
            setMessage({ text: `Hint: Starts with '${firstChar}'`, type: 'success' });
        }
        setScore(s => Math.max(0, s - 2));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGuess();
        }
    };

    const handleNicknameSubmit = (newNickname: string) => {
        setNickname(newNickname);
        setShowNicknameModal(false);
    };

    const handleShowAnswerClick = () => {
        if (!currentIdiom) return;
        setGuess(currentIdiom.phrase);
        setRevealed(true);
        updateUserStats('loss');
        setLeaderboardRefresh(prev => prev + 1);
        setMessage({ text: `Answer revealed: ${currentIdiom.phrase}`, type: 'success' });
    };

    if (!mounted) return null;

    if (loading && !currentIdiom) {
        return <div className="text-center text-white">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center w-full max-w-md">
            <header className="w-full flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Idiom Master</h1>
                    <p className="text-purple-200 text-sm">Guess the idiom, master the language.</p>
                </div>
                <div className="language-toggle flex gap-2">
                    <button
                        className={`px-3 py-1 rounded transition-colors ${language === 'en' ? 'bg-blue-600 text-white font-bold shadow-md' : 'bg-purple-800 text-purple-200 hover:bg-purple-700'}`}
                        onClick={() => handleLanguageChange('en')}
                    >
                        EN
                    </button>
                    <button
                        className={`px-3 py-1 rounded transition-colors ${language === 'zh' ? 'bg-blue-600 text-white font-bold shadow-md' : 'bg-purple-800 text-purple-200 hover:bg-purple-700'}`}
                        onClick={() => handleLanguageChange('zh')}
                    >
                        中文
                    </button>
                </div>
            </header>
            <div className="game-card relative w-full">
                {showNicknameModal && <NicknameModal onSubmit={handleNicknameSubmit} />}

                <div className="flex justify-between items-center mb-4 mt-8">
                    <div className="score-board">
                        <span>Score: <span id="score">{score}</span></span>
                        <span>Streak: <span id="streak">{streak}</span></span>
                    </div>
                </div>

                {nickname && (
                    <div className="text-center mb-2 text-purple-200 text-sm">
                        Playing as: <span className="font-bold text-white">{nickname}</span>
                    </div>
                )}

                <div className="idiom-display">
                    <p id="idiom-clue" className="clue-text">{currentIdiom?.clue}</p>
                    <div id="word-slots" className="slots-container flex flex-wrap justify-center gap-2">
                        {currentIdiom && (language === 'en' ? (
                            // English: Display whole words
                            currentIdiom.phrase.split(' ').map((word, index) => (
                                <div key={index} className={`px-3 py-2 rounded-lg border-2 border-white/30 text-white font-bold text-lg min-w-[60px] text-center ${revealed ? 'bg-white/20' : ''}`}>
                                    {revealed ? word : ''}
                                </div>
                            ))
                        ) : (
                            // Chinese: Display characters (existing logic)
                            currentIdiom.phrase.split('').map((char, index) => (
                                <div key={index} className={`letter-slot ${revealed ? 'filled' : ''}`}>
                                    {revealed ? char : ''}
                                </div>
                            ))
                        ))}
                    </div>
                </div>

                <div className="interaction-area">
                    <input
                        type="text"
                        id="guess-input"
                        placeholder={language === 'en' ? "Type your guess..." : "輸入成語..."}
                        autoComplete="off"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-white/20 border-2 border-white/30 rounded-lg px-4 py-3 text-white placeholder-purple-200 focus:outline-none focus:border-white text-center mb-4 ${shaking ? 'shake' : ''}`}
                        disabled={revealed}
                    />

                    {!revealed ? (
                        <div className="flex gap-2 justify-center mt-4">
                            <button id="submit-btn" className="primary-btn" onClick={handleGuess} disabled={revealed}>
                                {language === 'en' ? "Guess" : "猜"}
                            </button>
                            <button id="hint-btn" className="secondary-btn" onClick={handleHint} disabled={revealed}>
                                {language === 'en' ? "Hint" : "提示"}
                            </button>
                        </div>
                    ) : (
                        <button
                            id="next-round-btn"
                            className="w-full py-3 mt-4 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition shadow-lg"
                            onClick={() => loadNewIdiom()}
                        >
                            {language === 'en' ? "Next Round ➔" : "下一輪 ➔"}
                        </button>
                    )}
                </div>

                {failedAttempts >= 5 && !revealed && (
                    <button
                        onClick={handleShowAnswerClick}
                        className="mt-2 w-full text-sm text-purple-200 hover:text-white underline"
                    >
                        {language === 'en' ? "Show Answer" : "顯示答案"}
                    </button>
                )}

                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
            </div>

            <Leaderboard refreshTrigger={leaderboardRefresh} />
        </div>
    );
}
