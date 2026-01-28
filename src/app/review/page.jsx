"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { calculateNextReview } from "../../utils/reviewLogic";
import questionsData from "../../data/fe_questions.json"; // ※データのパスが正しいか要確認
import QuestionCard from "../../components/QuestionCard";
import Link from "next/link";
import { Home, CheckCircle, Repeat } from "lucide-react";

export default function ReviewPage() {
    const [reviewQueue, setReviewQueue] = useState([]);
    const [currentQ, setCurrentQ] = useState(null);
    const [loading, setLoading] = useState(true);

    // UI State
    const [selected, setSelected] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. 今やるべき復習を取得 (期限切れのもの)
            const { data: progressList } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)
                .lte('next_review_at', new Date().toISOString())
                .limit(20);

            if (!progressList || progressList.length === 0) {
                setLoading(false);
                return;
            }

            // 2. 問題データと結合
            const queue = progressList.map(p => {
                const qData = questionsData.find(q => String(q.id) === String(p.question_id));
                if (!qData) return null;

                const shuffledChoices = [...qData.choices].sort(() => Math.random() - 0.5);
                return {
                    ...qData,
                    choices: shuffledChoices,
                    answer: shuffledChoices.indexOf(qData.choices[qData.answer]),
                    progress: p
                };
            }).filter(Boolean);

            setReviewQueue(queue);
            if (queue.length > 0) setCurrentQ(queue[0]);
            setLoading(false);
        };

        fetchReviews();
    }, []);

    const handleAnswer = async (choiceIndex) => {
        if (showFeedback) return;
        const isAnswerCorrect = choiceIndex === currentQ.answer;

        // ★★★ 1. ここでコンソールに出す！ ★★★
        console.log("【診断】今の問題データ丸ごと:", currentQ);
        console.log("【診断】教科名は？:", currentQ.category);

        setSelected(choiceIndex);
        setIsCorrect(isAnswerCorrect);
        setShowFeedback(true);

        const { data: { user } } = await supabase.auth.getUser();
        const currentInterval = currentQ.progress.interval_days;
        const reviewData = calculateNextReview(currentInterval, isAnswerCorrect);

        await supabase.from('user_progress').upsert({
            user_id: user.id,
            question_id: currentQ.id,
            interval_days: reviewData.interval,
            next_review_at: reviewData.date
        }, { onConflict: 'user_id, question_id' });

        // ★★★ 2. 送信データを確認＆予備データを入れる ★★★
        const subjectToSend = currentQ.category || "データなし(プログラムは動いている)";

        console.log("【診断】Supabaseに送る教科名:", subjectToSend);

        await supabase.from("question_logs").insert({
            user_id: user.id,
            question_id: currentQ.id,
            is_correct: isAnswerCorrect,
            time_taken_ms: 0,

            // もし category が空なら "データなし..." という文字を保存する
            subject: subjectToSend
        });

        setTimeout(() => {
            setShowFeedback(false); setSelected(null); setIsCorrect(null);
            const nextQueue = reviewQueue.slice(1);
            setReviewQueue(nextQueue);
            if (nextQueue.length > 0) {
                setCurrentQ(nextQueue[0]);
            } else {
                setCurrentQ(null);
            }
        }, 1500);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">読み込み中...</div>;

    if (!currentQ && !loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full border border-slate-200">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">復習完了！</h2>
                    <p className="text-slate-500 mb-8">
                        今日やるべき復習はすべて終わりました。<br />
                        記憶が定着しました！
                    </p>
                    <Link href="/">
                        <button className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-700 transition">
                            ホームに戻る
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-orange-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition">
                        <Home className="w-5 h-5" />
                        <span className="font-bold text-sm">ホーム</span>
                    </Link>
                    <div className="bg-white px-4 py-1 rounded-full shadow-sm text-sm font-bold text-orange-600 flex items-center gap-2">
                        <Repeat className="w-4 h-4" />
                        復習モード 残り{reviewQueue.length}問
                    </div>
                </div>

                <QuestionCard
                    question={currentQ} selected={selected} isCorrect={isCorrect}
                    showFeedback={showFeedback} onAnswer={handleAnswer}
                    accentColor="orange"
                />
            </div>
        </div>
    );
}