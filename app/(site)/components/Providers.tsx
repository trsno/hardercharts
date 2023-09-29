'use client';
import { ThemeProvider } from 'next-themes';
export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			enableSystem={false}
			enableColorScheme={false}
			attribute='data-theme'
			themes={[
				'pink',
				'pink-dark',
				'green',
				'green-dark',
				'brown',
				'brown-dark',
				'pinkv2',
				'pinkv2-dark',
				'greenv2',
				'greenv2-dark',
				'brownv2',
				'brownv2-dark',
				'pinkgreen',
				'pinkgreen-dark',
				'purple',
				'purple-dark'
			]}>
			{children}
		</ThemeProvider>
	);
}