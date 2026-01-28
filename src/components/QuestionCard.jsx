"use client";

import { CheckCircle, XCircle } from "lucide-react";

export default function QuestionCard({
    question,
    selected,
    isCorrect,
    showFeedback,
    onAnswer
}) {
    return (
        <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            {/* カテゴリバッジ */}
            <div className="mb-4">
                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                    {question.category}
                </span>
            </div>

            {/* 問題文 */}
            <h2 className="text-xl font-bold text-gray-800 mb-6 leading-relaxed">
                {question.question}
            </h2>

            {/* 選択肢リスト */}
            <div className="space-y-3">
                {question.choices.map((choice, index) => {
                    // 色の判定ロジック
                    let btnClass = "border-gray-200 hover:bg-gray-50 text-gray-700"; // デフォルト

                    if (showFeedback) {
                        if (index === question.answer) {
                            btnClass = "bg-green-100 border-green-500 text-green-800 font-bold"; // 正解
                        } else if (selected === index) {
                            btnClass = "bg-red-100 border-red-500 text-red-800"; // 不正解を選んだ場合
                        } else {
                            btnClass = "opacity-50 border-gray-100"; // それ以外
                        }
                    } else if (selected === index) {
                        btnClass = "bg-indigo-50 border-indigo-500 text-indigo-700"; // 選択中
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => onAnswer(index)}
                            disabled={showFeedback}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex justify-between items-center ${btnClass}`}
                        >
                            <span>{choice}</span>
                            {/* 正解・不正解アイコン */}
                            {showFeedback && index === question.answer && (
                                <CheckCircle className="text-green-600 w-5 h-5" />
                            )}
                            {showFeedback && selected === index && index !== question.answer && (
                                <XCircle className="text-red-500 w-5 h-5" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* 判定メッセージ */}
            {showFeedback && (
                <div className={`mt-4 text-center font-bold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
                    {isCorrect ? "正解！ ナイス！" : "残念... 次は頑張ろう！"}
                </div>
            )}
        </div>
    );
}