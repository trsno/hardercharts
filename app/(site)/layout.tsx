import { Analytics } from '@vercel/analytics/react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Providers } from './components/Providers';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: {
		template: '%s | HarderCharts',
		default: 'HarderCharts | Hardstyle & Hardcore Top40 Charts'
	},
	description: 'Your go-to music charts hub for the hardstyle and hardcore scene. Daily updates of top 40 tracks',
	themeColor: 'rgb(var(--accent))',
	viewport: {
		width: 'device-width',
		initialScale: 1,
		minimumScale: 1,
		maximumScale: 1,
		userScalable: false,
		viewportFit: 'cover'
	}
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html
			lang='en'
			className='scroll-smooth'
			suppressHydrationWarning>
			<body className={`${inter.className} border-t-8 border-t-accent transition-[border] duration-1000 ease-out`}>
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	);
}
