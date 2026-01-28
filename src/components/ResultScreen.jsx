"use client";

import Link from "next/link";
import { Home, RefreshCw } from "lucide-react";

export default function ResultScreen({ score, total, onRetry }) {
    const percentage = Math.round((score / total) * 100);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">結果発表</h2>
                <p className="text-gray-500 mb-8">お疲れ様でした！</p>

                {/* スコア表示 */}
                <div className="mb-8">
                    <div className="text-6xl font-black text-indigo-600 mb-2">
                        {score}<span className="text-2xl text-gray-400 font-medium">/{total}</span>
                    </div>
                    <div className="text-lg font-bold text-gray-700">
                        正答率: {percentage}%
                    </div>
                </div>

                {/* アクションボタン */}
                <div className="space-y-3">
                    <button
                        onClick={onRetry}
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <RefreshCw className="w-5 h-5" />
                        もう一度挑戦
                    </button>

                    <Link href="/">
                        <button className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                            <Home className="w-5 h-5" />
                            ホームに戻る
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}