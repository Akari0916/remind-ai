"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { getAiSuggestedQuestions } from "../../utils/aiLogic";
import { calculateNextReview } from "../../utils/reviewLogic";
import QuestionCard from "../../components/QuestionCard";
import ResultScreen from "../../components/ResultScreen";
import Link from "next/link";
import { Home, Loader2, BrainCircuit } from "lucide-react";

export default function WeaknessPage() {
    const TOTAL_QUESTIONS = 5;
    const [quiz, setQuiz] = useState([]);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    // 現在の問題の進捗データ（間隔など）を保持
    const [progressMap, setProgressMap] = useState({});

    const startTimeRef = useRef(Date.now());
    const hasSavedRef = useRef(false);

    useEffect(() => {
        const initQuiz = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. 問題を取得
            const questions = await getAiSuggestedQuestions(TOTAL_QUESTIONS, 'ai');

            // 2. この問題たちの現在の進捗状況（interval）を取得
            const qIds = questions.map(q => q.id);
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('question_id, interval_days')
                .eq('user_id', user.id)
                .in('question_id', qIds);

            // マップ化
            const pMap = {};
            if (progressData) {
                progressData.forEach(p => {
                    pMap[p.question_id] = p.interval_days;
                });
            }
            setProgressMap(pMap);

            // 選択肢シャッフル
            const processed = questions.map(q => {
                const shuffledChoices = [...q.choices].sort(() => Math.random() - 0.5);
                return {
                    ...q,
                    choices: shuffledChoices,
                    originalAnswerStr: q.choices[q.answer],
                    answer: shuffledChoices.indexOf(q.choices[q.answer])
                };
            });
            setQuiz(processed);
            setLoading(false);
            startTimeRef.current = Date.now();
        };
        initQuiz();
    }, []);

    useEffect(() => {
        if (index >= TOTAL_QUESTIONS && !hasSavedRef.current) {
            saveData();
            hasSavedRef.current = true;
        }
    }, [index]);

    const saveData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // A. 履歴保存
        await supabase.from("history").insert({
            user_id: user.id, score: score, total: TOTAL_QUESTIONS,
            incorrect_ids: logs.filter(l => !l.isCorrect).map(l => l.questionId)
        });

        // B. ログ保存
        await supabase.from("question_logs").insert(
            logs.map(log => ({
                user_id: user.id, question_id: log.questionId, is_correct: log.isCorrect, time_taken_ms: log.timeTaken,
            }))
        );

        // C. ★復習スケジュールの更新 (Upsert)
        const progressUpdates = logs.map(log => {
            const currentInterval = progressMap[log.questionId] || 0;
            const reviewData = calculateNextReview(currentInterval, log.isCorrect);

            return {
                user_id: user.id,
                question_id: log.questionId,
                interval_days: reviewData.interval,
                next_review_at: reviewData.date
            };
        });

        const { error } = await supabase.from('user_progress').upsert(progressUpdates, { onConflict: 'user_id, question_id' });
        if (error) {
            // eslint-disable-next-line no-console
            console.error("Progress Error:", error);
        }
    };

    const handleAnswer = (choiceIndex) => {
        if (showFeedback) return;
        const endTime = Date.now();
        const timeTaken = endTime - startTimeRef.current;
        const currentQ = quiz[index];
        const isAnswerCorrect = choiceIndex === currentQ.answer;

        setSelected(choiceIndex);
        setIsCorrect(isAnswerCorrect);
        setShowFeedback(true);
        if (isAnswerCorrect) setScore(prev => prev + 1);

        setLogs(prev => [...prev, { questionId: currentQ.id, isCorrect: isAnswerCorrect, timeTaken: timeTaken }]);

        setTimeout(() => {
            setShowFeedback(false); setSelected(null); setIsCorrect(null);
            setIndex(prev => prev + 1); startTimeRef.current = Date.now();
        }, 1500);
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="font-bold">AIが学習プランを構築中...</p>
        </div>
    );

    if (index >= TOTAL_QUESTIONS) return <ResultScreen score={score} total={TOTAL_QUESTIONS} onRetry={() => window.location.reload()} />;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition">
                        <Home className="w-5 h-5" />
                        <span className="font-bold text-sm">ホーム</span>
                    </Link>
                    <div className="bg-white px-4 py-1 rounded-full shadow-sm text-sm font-bold text-indigo-600 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4" />
                        AI特訓モード {index + 1} / {TOTAL_QUESTIONS}
                    </div>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-500 ease-out" style={{ width: `${((index) / TOTAL_QUESTIONS) * 100}%` }} />
                </div>

                <QuestionCard
                    question={quiz[index]} selected={selected} isCorrect={isCorrect}
                    showFeedback={showFeedback} onAnswer={handleAnswer}
                    accentColor="indigo"
                />
            </div>
        </div>
    );
}