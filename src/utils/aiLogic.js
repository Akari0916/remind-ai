/* eslint-disable no-console */
import { supabase } from "../lib/supabase";
import questions from "../data/fe_questions.json";

// mode = 'ai' (デフォルト) か 'random' を選べるように変更
export async function getAiSuggestedQuestions(total = 5, mode = 'ai') {
    // A. ランダムモードの場合、即座にシャッフルして返す
    if (mode === 'random') {
        return [...questions].sort(() => Math.random() - 0.5).slice(0, total);
    }

    // --- 以下、AIモードのロジック ---

    // 1. ユーザー情報を取得
    const { data: { user } } = await supabase.auth.getUser();

    // 未ログインならランダムで返す
    if (!user) {
        return [...questions].sort(() => Math.random() - 0.5).slice(0, total);
    }

    // 2. 過去のログを取得
    const { data: logs, error } = await supabase
        .from('question_logs')
        .select('question_id, is_correct, time_taken_ms')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error("AI分析エラー:", error);
        return [...questions].sort(() => Math.random() - 0.5).slice(0, total);
    }

    // 3. 苦手カテゴリを計算
    const categoryStats = {};
    logs.forEach(log => {
        const q = questions.find(item => String(item.id) === String(log.question_id));
        if (!q) return;

        if (!categoryStats[q.category]) {
            categoryStats[q.category] = { total: 0, correct: 0 };
        }
        categoryStats[q.category].total++;
        if (log.is_correct) categoryStats[q.category].correct++;
    });

    // 4. 重み付け抽選
    const weightedQuestions = questions.map(q => {
        const stats = categoryStats[q.category];
        let weight = 10;

        if (stats) {
            const accuracy = stats.correct / stats.total;
            weight += (1 - accuracy) * 50; // 正答率が低いほど出やすい
        }
        return { ...q, sortScore: weight + Math.random() * 20 };
    });

    return weightedQuestions.sort((a, b) => b.sortScore - a.sortScore).slice(0, total);
}