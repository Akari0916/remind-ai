"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlus, Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);
        setSuccessMsg(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            // 成功時
            setSuccessMsg("確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。");
        } catch (error) {
            setErrorMsg("登録に失敗しました。もう一度お試しください。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans text-slate-800">
            <div className="max-w-md w-full bg-white rounded-[32px] shadow-xl p-8 border border-white relative overflow-hidden">

                {/* ヘッダー部分 */}
                <div className="text-center mb-8 relative z-10">
                    <div className="bg-slate-800 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-slate-300">
                        <UserPlus className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">アカウント作成</h1>
                    <p className="text-slate-400 text-xs font-bold tracking-widest mt-2 uppercase">Join ReMind.AI</p>
                </div>

                {/* 成功メッセージ (メール確認案内) */}
                {successMsg && (
                    <div className="mb-6 bg-green-50 border border-green-100 text-green-700 text-sm p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <p className="font-bold">{successMsg}</p>
                    </div>
                )}

                {/* エラーメッセージ */}
                {errorMsg && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-500 text-sm p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="font-bold">{errorMsg}</p>
                    </div>
                )}

                {/* 登録完了したらフォームを隠す */}
                {!successMsg && (
                    <form onSubmit={handleSignup} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all text-slate-800 font-medium placeholder-slate-300"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all text-slate-800 font-medium placeholder-slate-300"
                                    placeholder="6文字以上"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>CREATING...</span>
                                </>
                            ) : (
                                "SIGN UP"
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm font-medium">
                        すでにアカウントをお持ちですか？{" "}
                        <Link href="/login" className="text-slate-800 font-bold hover:underline decoration-2 decoration-slate-300 underline-offset-4">
                            ログイン
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}