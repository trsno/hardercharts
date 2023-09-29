'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
export default function DarkToggle() {
	const { theme, themes, setTheme } = useTheme();
	const [currentTheme, setCurrentTheme] = useState('light');
	useEffect(() => {
		let bg: string, fg: string, accent: string, xaccent: string;

		const onFocus = () => setFavicon(accent, xaccent);
		const onBlur = () => setFavicon(fg, bg);

		setTimeout(() => {
			accent = getComputedStyle(document.documentElement).getPropertyValue('--accent');
			xaccent = getComputedStyle(document.documentElement).getPropertyValue('--x-accent');
			bg = getComputedStyle(document.documentElement).getPropertyValue('--background');
			fg = getComputedStyle(document.documentElement).getPropertyValue('--text');

			document.querySelector('meta[name="theme-color"]')!.setAttribute('content', `rgb(${accent})`);
			setFavicon(accent, xaccent);
			window.addEventListener('focus', onFocus);
			window.addEventListener('blur', onBlur);
		});

		setCurrentTheme(theme!);

		return () => {
			window.removeEventListener('focus', onFocus);
			window.removeEventListener('blur', onBlur);
		};
	}, [theme]);

	const toggleDark = () => (theme!.indexOf('-dark') >= 0 ? setTheme(theme!.slice(0, -5)) : setTheme(theme + '-dark'));

	const changeTheme = () => {
		const allThemes = themes.filter(item => item.includes('-dark') === theme!.includes('-dark'));
		setTheme(allThemes[(allThemes.indexOf(theme!) + 1) % allThemes.length]);
	};

	const setFavicon = (bg: string, fg: string) => {
		const favicon = `data:image/svg+xml,
		<svg fill='rgb(${bg})' viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
			<rect width="500" height="500" style="" transform="matrix(1, 0, 0, 1, -2.3092638912203256e-13, -1.1723955140041653e-13)"/>
			<path fill='rgb(${fg})' d="M 396.623 417.433 C 397.718 430.168 394.929 440.211 388.255 447.557 C 381.58 454.902 372.582 459.059 361.26 460.033 C 350.292 460.976 340.486 457.809 331.842 450.535 C 323.197 443.26 318.464 434.847 317.643 425.294 L 296.466 179.055 C 296.009 173.748 293.584 168.343 289.19 162.84 C 284.796 157.336 280.122 154.798 275.17 155.224 C 269.508 155.711 265.038 159.659 261.754 167.069 C 259.057 173.005 257.876 177.92 258.21 181.811 L 279.479 429.111 C 280.391 439.724 277.004 449.015 269.311 456.983 C 261.62 464.95 252.645 469.374 242.385 470.256 C 230.003 471.321 220.13 468.43 212.769 461.58 C 205.409 454.727 201.226 445.463 200.222 433.789 L 166.357 40.017 C 165.383 28.694 167.923 18.853 173.975 10.493 C 177.307 5.889 181.598 2.392 186.848 0 L 221.299 0 C 227.917 3.756 232.897 10.28 236.238 19.572 C 240.144 35.989 243.873 52.419 247.427 68.864 C 252.639 88.019 262.28 98.594 276.352 100.592 C 286.996 100.033 304.114 100.165 327.707 100.986 C 341.689 101.923 353.303 110.549 362.546 126.86 C 369.717 139.787 373.924 153.501 375.172 168.01 L 396.623 417.433 Z" style="fill: rgb(255, 255, 255);" transform="matrix(1, 0, 0, 1, 0, -3.552713678800501e-15)"/>
		</svg>`;

		const link: HTMLLinkElement = window.document.querySelector("link[rel*='icon']") || window.document.createElement('link');
		link.type = 'image/svg+xml';
		link.rel = 'shortcut icon';
		link.href = encodeURI(favicon);
		window.document.getElementsByTagName('head')[0].appendChild(link);
	};
	return (
		<>
			<button
				onClick={changeTheme}
				className='inline-block p-2 align-middle text-text hover:text-accent'
				title={currentTheme}>
				<svg
					className='inline-block h-5 w-5'
					fill='currentColor'
					xmlns='http://www.w3.org/2000/svg'
					viewBox='0 -960 960 960'>
					<path d='M440-80q-33 0-56.5-23.5T360-160v-160H240q-33 0-56.5-23.5T160-400v-280q0-66 47-113t113-47h480v440q0 33-23.5 56.5T720-320H600v160q0 33-23.5 56.5T520-80h-80ZM240-560h480v-200h-40v160h-80v-160h-40v80h-80v-80H320q-33 0-56.5 23.5T240-680v120Zm0 160h480v-80H240v80Zm0-80v80-80Z' />
				</svg>
			</button>
			<button
				onClick={toggleDark}
				className='inline-block p-2 align-middle text-text hover:text-accent'>
				<svg
					className='h-5 w-5'
					fill='currentColor'
					viewBox='0 -960 960 960'
					xmlns='http://www.w3.org/2000/svg'>
					<path
						className='hidden dark:inline-block'
						d='M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Zm0-80q88 0 158-48.5T740-375q-20 5-40 8t-40 3q-123 0-209.5-86.5T364-660q0-20 3-40t8-40q-78 32-126.5 102T200-480q0 116 82 198t198 82Zm-10-270Z'
					/>

					<path
						className='dark:hidden'
						d='M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM80-440q-17 0-28.5-11.5T40-480q0-17 11.5-28.5T80-520h80q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440H80Zm720 0q-17 0-28.5-11.5T760-480q0-17 11.5-28.5T800-520h80q17 0 28.5 11.5T920-480q0 17-11.5 28.5T880-440h-80ZM480-760q-17 0-28.5-11.5T440-800v-80q0-17 11.5-28.5T480-920q17 0 28.5 11.5T520-880v80q0 17-11.5 28.5T480-760Zm0 720q-17 0-28.5-11.5T440-80v-80q0-17 11.5-28.5T480-200q17 0 28.5 11.5T520-160v80q0 17-11.5 28.5T480-40ZM226-678l-43-42q-12-11-11.5-28t11.5-29q12-12 29-12t28 12l42 43q11 12 11 28t-11 28q-11 12-27.5 11.5T226-678Zm494 495-42-43q-11-12-11-28.5t11-27.5q11-12 27.5-11.5T734-282l43 42q12 11 11.5 28T777-183q-12 12-29 12t-28-12Zm-42-495q-12-11-11.5-27.5T678-734l42-43q11-12 28-11.5t29 11.5q12 12 12 29t-12 28l-43 42q-12 11-28 11t-28-11ZM183-183q-12-12-12-29t12-28l43-42q12-11 28.5-11t27.5 11q12 11 11.5 27.5T282-226l-42 43q-11 12-28 11.5T183-183Zm297-297Z'
					/>
				</svg>
			</button>
		</>
	);
}
