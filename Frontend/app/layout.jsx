import "./inventory.css";

export const metadata = {
  title: "SS Supplement | Inventory",
  description: "Secure multi-store inventory and business operations workspace.",
};

export const viewport = { themeColor: "#07110e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return <html lang="en" className="inventory-html"><head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@500;600;700&family=Inter+Tight:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" /></head><body>{children}</body></html>;
}
