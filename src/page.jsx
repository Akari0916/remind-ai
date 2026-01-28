"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";
import { BookOpen, Trophy, Activity, LogOut, PlayCircle } from "lucide-react";

export default function Dashboard() {
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(true);
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [studyDays, setStudyDays] = useState(0);
    const [chartData, setChartData] = useState([]);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // 1. ユーザー確認
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/login");
                    return;
                }
                setUserName(user.email?.split("@")[0] || "Guest");

                // 2. 自分の学習データを取得
                const { data: myLogs, error: myError } = await supabase
                    .from("user_progress")
                    .select("*")
                    .eq("user_id", user.id);

                if (myError) throw myError;

                // 3. ★重要: みんなの平均データを取得（RPC関数呼び出し）
                const { data: globalStats, error: globalError } = await supabase
                    .rpc('get_global_category_stats');

                if (globalError) {
                    console.error("Global stats error:", globalError);
                }

                // --- 集計処理 ---

                // カテゴリごとの集計用マップ
                const categoryMap = {};

                // まず自分のログを集計
                myLogs.forEach((log) => {
                    if (!categoryMap[log.category]) {
                        categoryMap[log.category] = { total: 0, correct: 0 };
                    }
                    categoryMap[log.category].total += 1;
                    if (log.is_correct) categoryMap[log.category].correct += 1;
                });

                // グラフ用にデータを整形（自分 vs 平均）
                // データがない場合でも、主要教科を表示したい場合はここでデフォルト値を設定可能
                const formattedData = Object.keys(categoryMap).map((cat) => {
                    // A: 自分の正答率
                    const myAcc = Math.round((categoryMap[cat].correct / categoryMap[cat].total) * 100);

                    // B: みんなの平均正答率（globalStatsから探す）
                    const globalStat = globalStats?.find(s => s.category === cat);
                    const globalAcc = globalStat ? globalStat.average_accuracy : 0;

                    return {
                        subject: cat,
                        A: myAcc,      // 自分
                        B: globalAcc,  // 平均
                        fullMark: 100,
                    };
                });

                setChartData(formattedData);

                // KPI（合計学習数など）の計算
                setTotalQuestions(myLogs.length);
                const uniqueDays = new Set(myLogs.map(log => new Date(log.created_at).toDateString()));
                setStudyDays(uniqueDays.size);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        <span className="font-bold text-lg text-slate-800">ReMind.AI</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                {/* ユーザー挨拶 */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">こんにちは、{userName}さん</h1>
                    <p className="text-slate-500">今日の学習を始めましょう</p>
                </div>

                {/* スタッツカード */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="text-sm text-slate-500 font-medium">合計学習数</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{totalQuestions}<span className="text-sm font-normal text-slate-400 ml-1">問</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-5 h-5 text-emerald-500" />
                            <span className="text-sm text-slate-500 font-medium">継続日数</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{studyDays}<span className="text-sm font-normal text-slate-400 ml-1">日</span></p>
                    </div>
                </div>

                {/* レーダーチャート（自分 vs 平均） */}
                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-indigo-100/50 border border-indigo-50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        学習バランス
                    </h2>
                    <div className="h-64 w-full -ml-4">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                    />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />

                                    {/* ★ここがポイント: 2つのデータ系列を表示 */}

                                    {/* 1. みんなの平均（薄いオレンジ） */}
                                    <Radar
                                        name="みんなの平均"
                                        dataKey="B"
                                        stroke="#fb923c"
                                        strokeWidth={2}
                                        fill="#fb923c"
                                        fillOpacity={0.2}
                                    />

                                    {/* 2. あなたの成績（濃い青紫）- 上に重なるように後に書く */}
                                    <Radar
                                        name="あなた"
                                        dataKey="A"
                                        stroke="#4f46e5"
                                        strokeWidth={2}
                                        fill="#6366f1"
                                        fillOpacity={0.5}
                                    />

                                    <Legend />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <p>データがまだありません</p>
                                <p className="text-sm">問題を解くとグラフが表示されます</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 学習スタートボタン */}
                <button
                    onClick={() => router.push("/learning")}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 font-bold text-lg"
                >
                    <PlayCircle className="w-6 h-6" />
                    学習を始める
                </button>
            </main>
        </div>
    );
}