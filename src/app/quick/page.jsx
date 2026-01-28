"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase"; // 相対パスで確実に指定
import { getAiSuggestedQuestions } from "../../utils/aiLogic";
import QuestionCard from "../../components/QuestionCard";
import ResultScreen from "../../components/ResultScreen";
import Link from "next/link";
import { Home, Loader2 } from "lucide-react";

export default function QuickPage() {
    const TOTAL_QUESTIONS = 5; // テスト用に5問に設定
    const [quiz, setQuiz] = useState([]);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);

    // UI状態管理
    const [selected, setSelected] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [loading, setLoading] = useState(true);

    // ログ保存用
    const [logs, setLogs] = useState([]);
    const startTimeRef = useRef(Date.now());
    const hasSavedRef = useRef(false);

    // 1. 初期化：AIを使って問題をロード
    useEffect(() => {
        const initQuiz = async () => {
            setLoading(true);
            const questions = await getAiSuggestedQuestions(TOTAL_QUESTIONS, 'random');
            // 選択肢をシャッフルする処理
            const processed = questions.map(q => {
                const shuffledChoices = [...q.choices].sort(() => Math.random() - 0.5);
                return {
                    ...q,
                    choices: shuffledChoices,
                    originalAnswerStr: q.choices[q.answer], // 元の正解文字列
                    answer: shuffledChoices.indexOf(q.choices[q.answer]) // 新しい正解インデックス
                };
            });

            setQuiz(processed);
            setLoading(false);
            startTimeRef.current = Date.now(); // タイマースタート
        };

        initQuiz();
    }, []);

    // 2. 完了時のデータ保存処理
    useEffect(() => {
        if (index >= TOTAL_QUESTIONS && !hasSavedRef.current) {
            saveData();
            hasSavedRef.current = true;
        }
    }, [index]);

    const saveData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // 未ログインなら保存しない

        // A. 履歴テーブル(history)への保存
        await supabase.from("history").insert({
            user_id: user.id,
            score: score,
            total: TOTAL_QUESTIONS,
            incorrect_ids: logs.filter(l => !l.isCorrect).map(l => l.questionId)
        });

        // B. 詳細ログ(question_logs)への保存（これがAIの餌になる）
        await supabase.from("question_logs").insert(
            logs.map(log => ({
                user_id: user.id,
                question_id: log.questionId,
                is_correct: log.isCorrect,
                time_taken_ms: log.timeTaken,
            }))
        );

        // eslint-disable-next-line no-console
        console.log("学習データを保存しました");
    };

    // 3. 回答時の処理
    const handleAnswer = (choiceIndex) => {
        if (showFeedback) return; // 連打防止

        const endTime = Date.now();
        const timeTaken = endTime - startTimeRef.current;
        const currentQ = quiz[index];
        const isAnswerCorrect = choiceIndex === currentQ.answer;

        // 状態更新
        setSelected(choiceIndex);
        setIsCorrect(isAnswerCorrect);
        setShowFeedback(true);

        if (isAnswerCorrect) setScore(prev => prev + 1);

        // ログ記録
        setLogs(prev => [...prev, {
            questionId: currentQ.id,
            isCorrect: isAnswerCorrect,
            timeTaken: timeTaken
        }]);

        // 次の問題へ（1.5秒後）
        setTimeout(() => {
            setShowFeedback(false);
            setSelected(null);
            setIsCorrect(null);
            setIndex(prev => prev + 1);
            startTimeRef.current = Date.now(); // タイマーリセット
        }, 1500);
    };

    // --- レンダリング部分 ---

    // ロード中
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-600">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold">AIがあなた専用の問題を選んでいます...</p>
            </div>
        );
    }

    // 結果画面
    if (index >= TOTAL_QUESTIONS) {
        return <ResultScreen score={score} total={TOTAL_QUESTIONS} onRetry={() => window.location.reload()} />;
    }

    // クイズ画面
    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* ヘッダー */}
                <div className="flex justify-between items-center mb-6">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition">
                        <Home className="w-5 h-5" />
                        <span className="font-bold text-sm">ホーム</span>
                    </Link>
                    <div className="bg-white px-4 py-1 rounded-full shadow-sm text-sm font-bold text-gray-600">
                        {index + 1} / {TOTAL_QUESTIONS} 問目
                    </div>
                </div>

                {/* プログレスバー */}
                <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
                    <div
                        className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                        style={{ width: `${((index) / TOTAL_QUESTIONS) * 100}%` }}
                    />
                </div>

                {/* 問題カード */}
                <QuestionCard
                    question={quiz[index]}
                    selected={selected}
                    isCorrect={isCorrect}
                    showFeedback={showFeedback}
                    onAnswer={handleAnswer}
                />
            </div>
        </div>
    );
}