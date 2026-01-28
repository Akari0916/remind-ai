import "./globals.css";
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
    subsets: ["latin"],
    weight: ["400", "700"],
});

export const metadata = {
    title: "ReMind.AI",
    description: "AI学習コーチングアプリ",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            {/* antialiased だけ残す */}
            <body className={`${notoSansJP.className} antialiased`}>
                {children}
            </body>
        </html>
    );
}