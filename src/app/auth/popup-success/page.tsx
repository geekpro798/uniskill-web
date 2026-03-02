"use client";

// src/app/auth/popup-success/page.tsx
// OAuth 弹窗授权成功回调页面
// 当 GitHub OAuth 完成后跳转到此页：
//   1. 向父窗口发送 'auth-success' 消息
//   2. 自动关闭弹窗

import { useEffect } from "react";

export default function PopupSuccessPage() {
    useEffect(() => {
        /* 向打开此弹窗的父窗口发送成功消息，主页监听后更新 Session */
        if (window.opener) {
            window.opener.postMessage("uniskill-auth-success", window.location.origin);
        }
        /* 延迟 300ms 后关闭弹窗，确保消息已送达 */
        const timer = setTimeout(() => window.close(), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
            <div className="text-center">
                {/* 成功图标 */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                        <polyline points="20,6 9,17 4,12" />
                    </svg>
                </div>
                <p className="text-white font-semibold mb-1">Authorization Successful</p>
                <p className="text-slate-400 text-sm">Closing window...</p>
            </div>
        </div>
    );
}
