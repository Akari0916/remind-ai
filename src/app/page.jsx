"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import questions from "../data/fe_questions.json";
import { LogOut, BrainCircuit, Shuffle, BarChart3, ChevronRight, Bell } from "lucide-react";
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from "recharts";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);
    const [summary, setSummary] = useState({ totalQuestions: 0, accuracy: 0, streak: 0 });
    const [reviewCount, setReviewCount] = useState(0); // ★復習件数

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/login"); return; }
            setUser(user);

            // 1. ログ取得
            const { data: logs } = await supabase.from('question_logs').select('question_id, is_correct').eq('user_id', user.id);
            analyzeLogs(logs || []);

            // 2. ★今日やるべき復習の数を取得
            const { count } = await supabase
                .from('user_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .lte('next_review_at', new Date().toISOString());

            setReviewCount(count || 0);
            setLoading(false);
        };
        fetchData();
    }, [router]);

    const analyzeLogs = (logs) => {
        if (!logs || logs.length === 0) {
            const categories = [...new Set(questions.map(q => q.category))];
            setChartData(categories.map(cat => ({ subject: cat, A: 0, fullMark: 100 })));
            return;
        }
        const stats = {};
        questions.forEach(q => { if (!stats[q.category]) stats[q.category] = { correct: 0, total: 0 }; });
        let totalCorrect = 0;
        logs.forEach(log => {
            const q = questions.find(q => String(q.id) === String(log.question_id));
            if (q) {
                stats[q.category].total++;
                if (log.is_correct) { stats[q.category].correct++; totalCorrect++; }
            }
        });
        setChartData(Object.keys(stats).map(cat => ({
            subject: cat, A: stats[cat].total > 0 ? Math.round((stats[cat].correct / stats[cat].total) * 100) : 0, fullMark: 100
        })));
        setSummary({
            totalQuestions: logs.length,
            accuracy: logs.length > 0 ? Math.round((totalCorrect / logs.length) * 100) : 0,
            streak: logs.length
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium tracking-widest">読み込み中...</div>;

    return (
        <main className="app-container">
            <div className="main-card">

                <header className="app-header">
                    <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-slate-800 rounded-full"></span>
                        ReMind<span className="text-slate-400 font-light">.AI</span>
                    </h1>
                    <button onClick={handleLogout} className="btn-logout">ログアウト</button>
                </header>

                {/* ★ 通知バー (復習がある時だけ表示) */}
                {reviewCount > 0 && (
                    <Link href="/review" className="bg-orange-50 border-b border-orange-100 px-8 py-3 flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500 text-white p-1.5 rounded-full animate-pulse">
                                <Bell className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-orange-800 font-bold text-sm">復習のタイミングです！</p>
                                <p className="text-orange-600 text-xs">忘却曲線に基づいた問題が {reviewCount}問 あります</p>
                            </div>
                        </div>
                        <ChevronRight className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                )}

                <div className="content-area">

                    <section className="dashboard-section">
                        <div className="flex justify-between items-center mb-2 px-2">
                            <h2 className="section-title mb-0"><BarChart3 className="w-4 h-4" /> 分析データ</h2>
                            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">正答率: {summary.accuracy}%</div>
                        </div>
                        <div className="graph-box">
                            {summary.totalQuestions === 0 ? (
                                /* データがない時は手動で中央寄せする */
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 text-sm">
                                    <p>まだデータがありません</p>
                                    <p className="text-xs mt-2">問題を解くとグラフが表示されます</p>
                                </div>
                            ) : (
                                /* グラフがある時はサイズいっぱい使う */
                                <div className="w-full h-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="習熟度" dataKey="A" stroke="#475569" strokeWidth={2} fill="#94a3b8" fillOpacity={0.3} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} itemStyle={{ color: '#475569', fontWeight: 'bold' }} formatter={(value) => [`${value}%`, '正答率']} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid grid-cols-2 gap-4">
                        <div className="stat-card">
                            <p className="stat-label">総回答数</p>
                            <p className="stat-value">{summary.totalQuestions}<span className="text-sm text-slate-400 ml-1">問</span></p>
                        </div>
                        <div className="stat-card">
                            <p className="stat-label">現在のレベル</p>
                            <p className="stat-value">{Math.floor(summary.totalQuestions / 10) + 1}</p>
                        </div>
                    </section>

                    <section className="dashboard-section pt-2">
                        <h2 className="section-title">学習メニュー</h2>

                        <Link href="/weakness" className="action-card-primary group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="icon-circle-dark"><BrainCircuit className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="primary-text-main">AI 特訓モード</h3>
                                        <p className="primary-text-sub">苦手を分析して重点的に学習</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                        </Link>

                        <Link href="/quick" className="action-card-secondary group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="icon-circle-light"><Shuffle className="w-6 h-6" /></div>
                                    <div>
                                        <h3 className="secondary-text-main">ランダム演習</h3>
                                        <p className="secondary-text-sub">全範囲からランダムに出題</p>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                            </div>
                        </Link>
                    </section>

                </div>
            </div>
        </main>
    );
}