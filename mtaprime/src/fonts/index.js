import localFont from "next/font/local";
export const firago = localFont({
 src: [
 { path: "./FiraGO-400.ttf", weight: "400", style: "normal" },
 { path: "./FiraGO-500.ttf", weight: "500", style: "normal" },
 { path: "./FiraGO-600.ttf", weight: "600", style: "normal" },
 { path: "./FiraGO-700.ttf", weight: "700", style: "normal" },
 ], variable: "--font-firago", display: "swap",
});
export const mta = localFont({
 src: [
 { path: "./Mta-3-Light.otf", weight: "300", style: "normal" },
 { path: "./Mta-3-Medium.otf", weight: "500", style: "normal" },
 { path: "./Mta-3-UltraBold.otf", weight: "900", style: "normal" },
 ], variable: "--font-mta", display: "swap",
});
