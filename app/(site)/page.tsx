/* eslint-disable @next/next/no-img-element */
import { Track, getTracks } from '@/sanity/sanity-utils';
import Image from 'next/image';
import DarkToggle from './components/DarkToggle';
import LastSync from './components/LastSync';
import Player from './components/Player';
export default async function Home() {
	const tracks = await getTracks();
	const freshestTrackEntry = tracks.reduce((acc, track) => {
		const time = new Date(track._updatedAt ?? track.pos.entry).getTime();
		if (time > acc) acc = time;
		return acc;
	}, 0);

	const sortedTracks = tracks
		.sort((a, b) => a.pos.curr - b.pos.curr)
		.map(track => {
			const { curr, prev, peak, entry } = track.pos;
			const releaseDate = new Date(track.releaseDate).getTime();
			track.pos.changes = prev - curr;
			track.pos.status =
				(peak === curr && curr === prev) || releaseDate > Date.now() - 259e6 ? 'fresh' : prev - curr > 4 && curr === peak ? 'hot' : releaseDate > Date.now() - 1296e6 ? 'new' : '';
			track.pos.trend = Math.sign(track.pos.changes) === 0 ? 'st' : Math.sign(track.pos.changes) === 1 ? 'up' : 'dn';
			return track;
		});

	const HS = sortedTracks.filter(track => track.isHS);
	const HC = sortedTracks.filter(track => !track.isHS);

	const tracksForPlayer = {
		IDs: [...HS, ...HC].map(t => t._id),
		tracks: {
			...[...HS, ...HC].reduce((acc: { [key: string]: Track }, track) => {
				acc[track._id] = track;
				return acc;
			}, {})
		}
	};

	const renderTracks = (tracks: Track[]) =>
		tracks.map((track, index) => {
			const { _id, title, artist, mix, label, spotify, color, pos } = track;
			const { changes, status, trend } = pos;
			const cover = track.cover as string;
			return (
				<>
					<div
						key={_id}
						data-id={_id}
						className='track group grid cursor-default grid-cols-[auto_auto_1fr_auto] items-center gap-4 border border-transparent border-t-darkMuted/20 p-4 duration-300 ease-out first-of-type:border-t-transparent hover:rounded-lg hover:border-t-transparent hover:bg-darkMuted/10 dark:hover:bg-lightMuted/10 max-xs:grid-rows-1 max-xs:gap-3 max-xs:px-0 max-xs:py-6 max-xs:hover:-mx-1.5 max-xs:hover:px-1.5 [&:is(.playing)]:rounded-lg [&:is(.playing)]:border-darkVibrant/10 [&:is(.playing)]:bg-lightVibrant/10 [&:is(.playing)]:hover:bg-lightVibrant/20 dark:[&:is(.playing)]:bg-darkVibrant/20 dark:[&:is(.playing)]:hover:bg-darkVibrant/30 max-xs:[&:is(.playing)]:-mx-1.5 max-xs:[&:is(.playing)]:px-1.5'
						style={
							{
								'--darkMuted': color?.darkMuted?.background,
								'--darkVibrant': color?.darkVibrant?.background,
								'--dominant': color?.dominant?.background,
								'--lightMuted': color?.lightMuted?.background,
								'--lightVibrant': color?.lightVibrant?.background,
								'--muted': color?.muted?.background,
								'--vibrant': color?.vibrant?.background,
								'--x-darkMuted': color?.darkMuted?.foreground,
								'--x-darkVibrant': color?.darkVibrant?.foreground,
								'--x-dominant': color?.dominant?.foreground,
								'--x-lightMuted': color?.lightMuted?.foreground,
								'--x-lightVibrant': color?.lightVibrant?.foreground,
								'--x-muted': color?.muted?.foreground,
								'--x-vibrant': color?.vibrant?.foreground
							} as React.CSSProperties
						}>
						<div className='w-6 text-center max-xs:row-span-2'>
							<div className='text-xl font-semibold max-xl:text-base'>{index + 1}</div>
							{status && (
								<div
									className={`border border-vibrant/20 font-medium text-text [writing-mode:vertical-lr] group-hover:hidden group-hover:opacity-0 dark:text-background [&+div]:hidden group-hover:[&+div]:block ${status} mx-auto rotate-180 rounded-full py-2 text-xs [&.fresh]:bg-sky-300 [&.hot]:bg-orange-300 [&.new]:bg-yellow-300`}>
									{status}
								</div>
							)}
							<div
								className={`${trend} relative flex aspect-square w-full flex-col-reverse text-xs font-bold drop-shadow [&.dn>span]:-ml-1 [&.dn]:text-rose-500 dark:[&.dn]:text-rose-300 [&.st]:text-sky-500 dark:[&.st]:text-sky-300 [&.up]:text-emerald-500 dark:[&.up]:text-emerald-300 [&>svg]:mx-auto [&>svg]:w-4`}>
								<span className='changes'>{changes !== 0 ? changes : ''}</span>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									viewBox='0 0 24 24'
									fill='currentColor'>
									{trend === 'st' && <path d='M15,5l-1.41,1.41L18.17,11H2V13h16.17l-4.59,4.59L15,19l7-7L15,5z' />}
									{trend === 'up' && <path d='M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z' />}
									{trend === 'dn' && <path d='M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z' />}
								</svg>
							</div>
						</div>
						<div className='relative overflow-hidden rounded-lg border-2 border-darkVibrant aspect-square bg-darkVibrant duration-100 ease-out group-hover:shadow-md group-hover:shadow-darkMuted group-[.playing]:shadow-md group-[.playing]:shadow-darkMuted xs:w-20 max-xs:row-span-2'>
							<div className='progress absolute inset-0 grid cursor-pointer place-items-center text-lightVibrant opacity-0 duration-300 ease-out group-hover:opacity-80 group-hover:hover:opacity-90 group-[.playing]:opacity-80 group-[.playing]:hover:opacity-90'>
								<svg
									className='relative z-10 w-8 group-[.playing:not(.paused)]:hidden'
									xmlns='http://www.w3.org/2000/svg'
									viewBox='0 -960 960 960'
									fill='currentColor'>
									<path d='M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z' />
								</svg>
								<svg
									className='relative z-10 hidden w-8 group-[.playing:not(.paused)]:block'
									xmlns='http://www.w3.org/2000/svg'
									viewBox='0 -960 960 960'
									fill='currentColor'>
									<path d='M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z' />
								</svg>
							</div>
							{cover && (
								<Image
									src={cover}
									width={96}
									height={96}
									alt={title}
								/>
							)}
						</div>
						<div className='flex flex-col overflow-hidden max-xs:col-span-2 max-xs:gap-1 '>
							<div className='title w-max whitespace-nowrap text-xl font-semibold max-xl:text-base'>
								{title}
								{mix && <span className='ml-1 font-normal opacity-70'>({mix})</span>}
							</div>
							<div className='artist w-max whitespace-nowrap text-lg max-xl:text-sm'>{artist.full}</div>
							<div className='font-mono text-sm max-xl:text-xs'>{label}</div>
							{/* <div>
								<div className='grid grid-cols-7'>
									<div className='bg-darkMuted text-x-darkMuted'>darkMuted</div>
									<div className='bg-darkVibrant text-x-darkVibrant'>darkVibrant</div>
									<div className='bg-dominant text-x-dominant'>dominant</div>
									<div className='bg-lightMuted text-x-lightMuted'>lightMuted</div>
									<div className='bg-lightVibrant text-x-lightVibrant'>lightVibrant</div>
									<div className='bg-muted text-x-muted'>muted</div>
									<div className='bg-vibrant text-x-vibrant'>vibrant</div>
								</div>
							</div> */}
						</div>
						{spotify && (
							<div className=''>
								<a
									href={`https://open.spotify.com/track/${spotify}`}
									className='spotify cursor-pointer rounded-full bg-black/5 px-1.5 pb-2 pt-1.5 text-xs font-semibold text-black/90 hover:ring-4 hover:ring-darkMuted/20 active:ring-darkMuted/30 dark:bg-white/10 dark:text-white/90'>
									<img
										alt='listen on spotify'
										src='https://cdn.simpleicons.org/Spotify'
										className='mr-1 inline-block w-4'
									/>
									Spotify
								</a>
							</div>
						)}
					</div>
				</>
			);
		});

	return (
		<div className='container mx-auto gap-x-4 gap-y-16 p-4 max-xl:px-2'>
			<main className=''>
				<section id='hardstyle'>
					<h1 className='my-4 text-3xl font-bold max-xs:text-2xl'>Hardstyle</h1>
					<div>{renderTracks(HS)}</div>
				</section>
				<section id='hardcore'>
					<h1 className='my-4 text-3xl font-bold max-xs:text-2xl'>Hardcore</h1>
					<div>{renderTracks(HC)}</div>
				</section>
			</main>
			<aside className='grid auto-rows-max place-items-center content-center gap-4 lg:sticky lg:top-0 lg:h-screen'>
				<Player trackData={tracksForPlayer} />
				<header className='rounded-lg text-center max-lg:mb-56'>
					<h1 className='text-4xl font-black max-xl:text-3xl'>HarderCharts</h1>
					<p className='text-xl font-medium max-xl:text-lg'>
						<a
							className='underline decoration-1'
							href='#hardstyle'>
							Hardstyle
						</a>
						{' & '}
						<a
							className='underline decoration-1'
							href='#hardcore'>
							Hardcore
						</a>
						<br />
						Top 40 Charts
					</p>
					<LastSync time={freshestTrackEntry} />
					<div>
						<DarkToggle />
					</div>
				</header>
			</aside>
		</div>
	);
}
