"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Shield, Users, Database, Activity, AlertTriangle, ArrowLeft } from "lucide-react";

export default function AdminDashboard() {
    // ★重要：ここにあなたのメールアドレスを入れてください！
    const ADMIN_EMAIL = "akari20040916@icloud.com";

    const router = useRouter();
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState({
        totalLogs: 0,
        totalUsers: 0,
        logs: []
    });

    useEffect(() => {
        const checkAdminAndFetch = async () => {
            try {
                // 1. ログインユーザーの確認
                const { data: { user } } = await supabase.auth.getUser();

                // ログインしていない、またはメールアドレスが管理者と違う場合は追い出す
                if (!user || user.email !== ADMIN_EMAIL) {
                    console.warn("管理者権限がありません。ホームへリダイレクトします。");
                    router.push("/");
                    return;
                }

                // 管理者認定！
                setIsAdmin(true);

                // 2. 全データの取得（自分以外のデータも見れます）
                // ※ 本来は他人のデータを見るべきではありませんが、管理者としてシステム全体のログを取得します
                const { data: allLogs, error: logError } = await supabase
                    .from("question_logs")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(100); // 最新100件

                if (logError) throw logError;

                // ユーザー数の概算（ユニークIDを数える）
                const uniqueUsers = new Set(allLogs.map(log => log.user_id));

                setStats({
                    totalLogs: allLogs.length, // ※limitを外せば全件数になります
                    totalUsers: uniqueUsers.size,
                    logs: allLogs
                });

            } catch (error) {
                console.error("Admin Load Error:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAdminAndFetch();
    }, [router, supabase, ADMIN_EMAIL]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">読み込み中...</div>;
    }

    // 万が一ガードをすり抜けても表示させない
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto">

                {/* ヘッダーエリア */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-800 p-3 rounded-xl text-white">
                            <Shield className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                            <p className="text-slate-500 text-sm">システム管理者専用ページ</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        アプリに戻る
                    </button>
                </div>

                {/* 統計カード */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2 text-indigo-600 font-bold">
                            <Database className="w-5 h-5" />
                            <span>取得ログ数 (直近)</span>
                        </div>
                        <p className="text-4xl font-extrabold">{stats.totalLogs}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2 text-emerald-600 font-bold">
                            <Users className="w-5 h-5" />
                            <span>アクティブユーザー</span>
                        </div>
                        <p className="text-4xl font-extrabold">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-2 text-orange-600 font-bold">
                            <Activity className="w-5 h-5" />
                            <span>システム状態</span>
                        </div>
                        <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            正常稼働中
                        </p>
                    </div>
                </div>

                {/* 生データテーブル */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Database className="w-5 h-5 text-slate-400" />
                            最新の学習ログ (Raw Data)
                        </h2>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Limit: 100</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">User ID (Last 4)</th>
                                    <th className="px-6 py-4">Subject</th>
                                    <th className="px-6 py-4">Result</th>
                                    <th className="px-6 py-4">Q.ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {stats.logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition">
                                        <td className="px-6 py-4 text-slate-500">
                                            {new Date(log.created_at).toLocaleString("ja-JP")}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">
                                            ...{log.user_id.slice(-4)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            {log.subject || <span className="text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> NULL</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.is_correct ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">正解</span>
                                            ) : (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">不正解</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">#{log.question_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
