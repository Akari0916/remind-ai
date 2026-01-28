"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Play, TrendingUp, Activity } from "lucide-react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState([]);

    // 初期データがない場合のダミーデータ（UI確認用）
    const dummyData = [
        { subject: 'セキュリティ', A: 40, fullMark: 100 },
        { subject: 'ネットワーク', A: 80, fullMark: 100 },
        { subject: 'アルゴリズム', A: 30, fullMark: 100 },
        { subject: 'DB', A: 90, fullMark: 100 },
        { subject: 'マネジメント', A: 65, fullMark: 100 },
    ];

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);

            // ★ここに将来、実際の学習ログ取得処理が入ります
            // 現在はまだデータがないため、ダミーを表示します
            setChartData(dummyData);

            setLoading(false);
        };

        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>;

    return (
        <main className="min-h-screen bg-gray-50">
            {/* ヘッダー */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">ReMind.AI</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 hidden sm:block">{user?.email}</span>
                        <button
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-red-500 transition"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8">

                {/* メインアクションエリア */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* 左側: スコアチャート */}
                    <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp className="text-indigo-600 w-5 h-5" />
                                現在の能力分析 (AI Analysis)
                            </h2>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                Beta版
                            </span>
                        </div>

                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="習熟度"
                                        dataKey="A"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fill="#6366f1"
                                        fillOpacity={0.4}
                                    />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 右側: アクションカード */}
                    <div className="space-y-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white">
                            <h3 className="text-xl font-bold mb-2">クイック復習</h3>
                            <p className="text-indigo-100 text-sm mb-6">AIがあなたの苦手を分析し、最適な10問を出題します。</p>

                            <Link href="/quick">
                                <button className="w-full bg-white text-indigo-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
                                    <Play className="w-5 h-5 fill-indigo-700" />
                                    今すぐ開始
                                </button>
                            </Link>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-2">学習ステータス</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">本日の学習時間</span>
                                    <span className="font-medium">0分</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">連続学習日数</span>
                                    <span className="font-medium">1日目</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}