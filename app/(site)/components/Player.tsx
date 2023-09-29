/* eslint-disable @next/next/no-img-element */
'use client';

import { Track } from '@/sanity/sanity-utils';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import Viz from './Viz';

export default function Player({ trackData }: { trackData: { tracks: { [key: string]: Track }; IDs: string[] } }) {
	const [tracks] = useState(trackData.tracks);
	const [IDs] = useState(trackData.IDs);

	const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
	const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
	const [analyser, setanalyser] = useState<AnalyserNode | null>(null);
	const [paused, setPaused] = useState(true);

	const [track, setTrack] = useState<Track | null>(null);
	const [miniPlayer, setMiniPlayer] = useState(false);

	// marquee animation for overflowing text
	const scrollText = (selector: string) => {
		document.querySelectorAll(selector).forEach(el => {
			const elWidth = +el.clientWidth;
			const parentWidth = +(el.parentElement?.clientWidth ?? elWidth);
			if (elWidth - 15 > parentWidth) {
				(el as HTMLElement).style.setProperty('--wDiff', (elWidth - parentWidth).toString());
				el.classList.add('scrollText');
			} else {
				if (el.matches('.scrollText')) el.classList.remove('scrollText');
			}
		});
	};

	// marquee animation for overflowing text
	useEffect(() => {
		if (track) scrollText('#player .title, #player .artist');
	}, [track, miniPlayer]);

	// on Mount Effect
	useEffect(() => {
		const trackOnClickFn = (event: { target: any }) => {
			const target = event.target;
			const el = target.closest('.track');
			if (target instanceof HTMLElement && target.matches('.spotify')) return;
			const id = el?.dataset?.id ?? '';
			if (!tracks[id].audio) return;
			if (el.matches('.playing.paused')) {
				audio?.play();
			} else if (el.matches('.playing')) {
				setTrack(null);
			} else {
				setTrack(tracks[id]);
			}
		};
		document.querySelectorAll('.track').forEach(el => {
			el.addEventListener('click', trackOnClickFn, true);
		});
		if (audio) return;
		setAudio(document.createElement('audio'));
		setCanvas(document.createElement('canvas'));
		scrollText('.title, .artist');
		return () => {
			document.querySelectorAll('.track').forEach(el => {
				el.removeEventListener('click', trackOnClickFn, true);
			});
		};
	}, [audio, tracks]);

	useEffect(() => {
		if (paused) {
			document.querySelector('.track.playing')?.classList.add('paused');
			document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--accent')})`);
			document.body.style.borderTopColor = `rgb(var(--accent))`;
		} else {
			const vibrant = getComputedStyle(document.querySelector('#player')!).getPropertyValue('--vibrant');
			document.querySelector('.track.playing')?.classList.remove('paused');
			document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${vibrant})`);
			document.body.style.borderTopColor = `rgb(${vibrant})`;
		}
	}, [paused]);

	// for Visualizer | Connect audio to canvas viz
	useEffect(() => {
		if (!audio || analyser) return;
		audio.crossOrigin = 'anonymous';

		const connectAnalyzer = () => {
			const audioContext = new AudioContext();
			const nextAnalyser = audioContext.createAnalyser();
			const source = audioContext.createMediaElementSource(audio);
			source.connect(nextAnalyser);
			nextAnalyser.connect(audioContext.destination);
			setanalyser(nextAnalyser);
			audio.removeEventListener('loadstart', connectAnalyzer, true);
		};

		// TODO: below, or try (e.isTrusted) for firefox and (navigator.userActivation.hasBeenActive) for chrome
		audio.addEventListener('loadstart', connectAnalyzer, true);
	}, [analyser, audio]);

	// play next track from IDs list
	const playNext = useCallback(() => {
		if (!track) return;
		const nextIDIndex = IDs.indexOf(track._id) + 1;
		if (nextIDIndex < IDs.length) setTrack(tracks[IDs[nextIDIndex]]);
	}, [IDs, track, tracks]);

	// play prev track from IDs list
	const playPrev = useCallback(() => {
		if (!track || !audio) return;
		const prevIDIndex = IDs.indexOf(track._id) - 1;
		if (prevIDIndex >= 0 && audio.currentTime < 10) {
			setTrack(tracks[IDs[prevIDIndex]]);
		} else {
			audio.currentTime = 0;
		}
	}, [IDs, audio, track, tracks]);

	// playback effect
	useEffect(() => {
		if (!audio) return;
		document.querySelector('.track.playing')?.classList.remove('playing');
		const docTitle = document.title;

		if (!track) {
			audio.pause();
			document.title = docTitle;
			return;
		}

		document.querySelector(`.track[data-id='${track._id}']`)?.classList.add('playing');
		const trackAudio = track.audio as string;
		if (audio.src !== trackAudio) {
			document.querySelector('#likeBtn')?.classList.add('loading');
			const vibrant = getComputedStyle(document.querySelector('#player')!).getPropertyValue('--vibrant');
			document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${vibrant})`);
			document.body.style.borderTopColor = `rgb(${vibrant})`;
			audio.src = trackAudio;
			audio.load();
		} else {
			audio.play();
		}
		const currID = IDs.indexOf(track._id);
		const nextIDIndex = currID + 1;
		const { artist, title, cover } = track;
		let scrollingTitle = `${artist.full} - ${title} † `;
		const oncanplayFn = () => {
			audio.play();
			document.title = scrollingTitle;
			// Generating MediaSession
			const { mediaSession } = navigator;
			if (!mediaSession) return;
			mediaSession.metadata = new MediaMetadata({
				title,
				artist: artist.full,
				artwork: [
					{
						src: cover as string,
						sizes: '500x500',
						type: 'image/png'
					}
				]
			});
			mediaSession.setActionHandler('stop', stopPlaying);
			mediaSession.setActionHandler('play', () => audio.play());
			mediaSession.setActionHandler('pause', () => audio.pause());
			mediaSession.setActionHandler('seekbackward', details => (audio.currentTime -= details.seekOffset || 10));
			mediaSession.setActionHandler('seekforward', details => (audio.currentTime += details.seekOffset || 10));
			mediaSession.setActionHandler('nexttrack', playNext);
			mediaSession.setActionHandler('previoustrack', playPrev);
		};
		let lastSecond = 0;
		const ontimeupdateFn = () => {
			const seconds = Math.floor(audio.currentTime);
			const duration = audio.duration;
			if (seconds !== lastSecond) {
				const seekPos = audio.currentTime / duration || 0;
				document.querySelectorAll('.playing .progress, #player .progressBar').forEach(el => (el as HTMLElement).style.setProperty('--progress', (seekPos * 100).toFixed(5)));
				document.title = docTitle === document.title ? docTitle : scrollingTitle;
				scrollingTitle = scrollingTitle.substring(1) + scrollingTitle[0];
				lastSecond = seconds;
			}

			const elapsed = document.querySelector('div#timeElapsed');
			if (elapsed)
				elapsed.textContent = `0${parseInt(`${audio.currentTime / 60}`)}:${
					parseInt(`${audio.currentTime % 60}`) < 10 ? '0' + parseInt(`${audio.currentTime % 60}`) : parseInt(`${audio.currentTime % 60}`)
				}`;
			const total = document.querySelector('div#timeTotal');
			if (total)
				total.textContent = `0${parseInt(`${duration / 60}`) || '0'}:${(parseInt(`${duration % 60}}`) < 10 ? '0' + parseInt(`${duration % 60}}`) : parseInt(`${duration % 60}}`)) || '00'}`;
		};
		const stopPlaying = () => (audio.pause(), (document.title = docTitle));
		const onplayFn = () => {
			setPaused(false);
		};
		const onpauseFn = () => {
			setPaused(true);
			document.title = docTitle;
		};

		const onendedFn = () => (nextIDIndex < IDs.length ? setTrack(tracks[IDs[nextIDIndex]]) : setTrack(null));
		audio.onplay = onplayFn;
		audio.onpause = onpauseFn;
		audio.oncanplay = oncanplayFn;
		audio.ontimeupdate = ontimeupdateFn;
		audio.onended = onendedFn;
		return () => {
			audio.removeEventListener('onplay', onplayFn);
			audio.removeEventListener('onpause', onpauseFn);
			audio.removeEventListener('oncanplay', oncanplayFn);
			audio.removeEventListener('ontimeupdate', ontimeupdateFn);
			audio.removeEventListener('onended', onendedFn);
		};
	}, [IDs, audio, playNext, playPrev, track, tracks]);

	return (
		<>
			{track && audio && (
				<div
					className={`${
						paused ? 'audioPaused' : ''
					} flex flex-col justify-items-center gap-4 ease-out max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:grid max-lg:justify-center max-lg:bg-gradient-to-t max-lg:from-background max-lg:via-background max-lg:via-[120px] max-lg:to-transparent [&.audioPaused]:pb-8 [&.audioPaused]:delay-300 [&.audioPaused]:max-lg:via-[1rem]`}>
					<div
						id='player'
						className={`${track.canvas && !miniPlayer ? 'withCanvas' : ''} ${
							miniPlayer ? 'mini' : ''
						} group relative flex w-80 max-w-full flex-col gap-4 overflow-hidden rounded-xl border-vibrant bg-darkVibrant p-4 text-lightVibrant shadow-lg duration-75 ease-out [&:is(.mini)]:flex-row [&:is(.mini)]:gap-2 [&:is(.mini)]:rounded-lg [&:is(.mini)]:bg-gradient-to-r [&:is(.mini)]:from-darkVibrant [&:is(.mini)]:to-darkMuted [&:is(.mini)]:p-3 [&:is(.mini)]:opacity-90 [&:is(.withCanvas)]:bg-gradient-to-t [&:is(.withCanvas)]:from-lightVibrant/80 [&:is(.withCanvas)]:to-black/70 [&:is(.withCanvas,.mini)]:bg-transparent`}
						style={
							track.color
								? ({
										'--darkMuted': track.color.darkMuted?.background,
										'--darkVibrant': track.color.darkVibrant?.background,
										'--dominant': track.color.dominant?.background,
										'--lightMuted': track.color.lightMuted?.background,
										'--lightVibrant': track.color.lightVibrant?.background,
										'--muted': track.color.muted?.background,
										'--vibrant': track.color.vibrant?.background,
										'--x-darkMuted': track.color.darkMuted?.foreground,
										'--x-darkVibrant': track.color.darkVibrant?.foreground,
										'--x-dominant': track.color.dominant?.foreground,
										'--x-lightMuted': track.color.lightMuted?.foreground,
										'--x-lightVibrant': track.color.lightVibrant?.foreground,
										'--x-muted': track.color.muted?.foreground,
										'--x-vibrant': track.color.vibrant?.foreground
								  } as React.CSSProperties)
								: {}
						}>
						{/* spotify canvas */}
						{!miniPlayer && track && track.canvas && (
							<video
								className='absolute inset-0 -z-10 h-full w-full rounded-xl object-cover'
								autoPlay
								loop
								muted
								playsInline
								src={track.canvas}></video>
						)}

						{/* label text */}
						{!miniPlayer && <div className='text-center text-xs font-bold uppercase tracking-widest text-vibrant drop-shadow-lg'>{track.label}</div>}

						{/* cover art */}
						<Image
							className='group-[.mini]:h-12 group-[.mini]:w-12  group-[.mini]:rounded group-[.withCanvas]:mix-blend-lighten group-[.withCanvas]:brightness-90 group-[.withCanvas]:contrast-150'
							src={track.cover as string}
							width={320}
							height={320}
							alt={track.title}
						/>

						{/* title artist text and like btn */}
						<div className='flex cursor-default justify-between mix-blend-screen drop-shadow-lg group-[.mini]:z-10 group-[.mini]:w-52'>
							<div
								className='w-full overflow-hidden'
								onClick={() => {
									if (miniPlayer) setMiniPlayer(!miniPlayer);
								}}>
								<div className='title w-max whitespace-nowrap text-xl font-bold group-[.mini]:text-base group-[.mini]:font-semibold'>
									{track.title}
									{track.mix && <span className='ml-1 font-semibold opacity-70'>({track.mix})</span>}
								</div>
								<div className='artist w-max whitespace-nowrap text-lg font-semibold group-[.mini]:text-sm group-[.mini]:font-normal'>{track.artist.full}</div>
							</div>
							{track.spotify && (
								<div className='self-center pl-3 group-[.mini]:pr-2'>
									<div
										id='likeBtn'
										className='[&:not(:hover)]:brightness-120 drop-shadow-lg [&.loading:after]:hidden [&.loading:before]:hidden [&.loading>iframe]:invert-0 [&.loading>svg]:block [&.loading]:pointer-events-none [&:hover>iframe]:contrast-100'>
										<svg
											className='relative z-10 hidden aspect-square w-full animate-spin text-lightVibrant'
											xmlns='http://www.w3.org/2000/svg'
											fill='none'
											viewBox='0 0 24 24'>
											<path
												fill='currentColor'
												d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
										</svg>
										<iframe
											className='brightness-90 contrast-[9] invert duration-300 ease-out'
											onLoad={e => {
												const target = e.target as HTMLIFrameElement;
												target.parentElement?.classList.remove('loading');
											}}
											onLoadStart={() => alert('unload')}
											src={`https://open.spotify.com/embed/track/${track.spotify}`}></iframe>
									</div>
								</div>
							)}
						</div>

						{/* progress bar */}
						<div className='group-[.mini]:absolute group-[.mini]:inset-x-3 group-[.mini]:bottom-0'>
							<div
								onClick={e => {
									if (!miniPlayer) {
										const target = e.target as HTMLElement;
										const percentage = ((e.clientX - target.getBoundingClientRect().left) / target.clientWidth) * 100;
										audio.currentTime = (percentage / 100) * audio.duration;
									}
								}}
								className='progressBar mb-2 h-2.5 w-full cursor-pointer rounded-full bg-lightVibrant/25 group-[.mini]:mb-0 group-[.mini]:h-0.5 group-[.mini]:bg-vibrant'>
								<div className='pointer-events-none h-full w-[calc(var(--progress)_*_1%)] rounded-full bg-lightVibrant'></div>
							</div>
							{!miniPlayer && (
								<div className='flex justify-between text-xs drop-shadow-lg'>
									<div id='timeElapsed'>00:00</div>
									<div id='timeTotal'>00:00</div>
								</div>
							)}
						</div>

						{/* Play btn prev next */}
						<div className='flex items-center justify-center gap-8 drop-shadow-lg group-[.mini]:z-10 group-[.mini]:justify-end'>
							{!miniPlayer && (
								<div
									className='inline-block w-9 cursor-pointer hover:text-vibrant'
									onClick={playPrev}>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 -960 960 960'
										fill='currentColor'>
										<path d='M220-240v-480h80v480h-80Zm520 0L380-480l360-240v480Zm-80-240Zm0 90v-180l-136 90 136 90Z' />
									</svg>
								</div>
							)}

							<div
								className='relative w-20 cursor-pointer rounded-full bg-darkVibrant/20 p-4 text-lightVibrant hover:bg-darkVibrant/30 hover:text-vibrant group-[.mini]:-mx-4 group-[.mini]:w-12 group-[.mini]:bg-transparent group-[.mini]:p-2'
								onClick={() => (audio && audio.paused ? audio.play() : audio.pause())}>
								<div className={`${paused ? '' : 'playing'} group relative z-10`}>
									<svg
										className='group-[.playing]:hidden'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 -960 960 960'
										fill='currentColor'>
										<path d='M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z' />
									</svg>
									<svg
										className='hidden group-[.playing]:block'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 -960 960 960'
										fill='currentColor'>
										<path d='M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z' />
									</svg>
								</div>
							</div>
							{!miniPlayer && (
								<div
									className='inline-block w-9 cursor-pointer hover:text-vibrant'
									onClick={playNext}>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 -960 960 960'
										fill='currentColor'>
										<path d='M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z' />
									</svg>
								</div>
							)}
						</div>

						{/* Spotify Btn */}
						{!miniPlayer && track.spotify && (
							<div className='my-4 flex-none text-center'>
								<a
									href={`https://open.spotify.com/track/${track.spotify}`}
									className='spotify cursor-pointer rounded-full bg-white px-4 pb-2 pt-1.5 text-xs font-semibold text-black/90 hover:ring-4 hover:ring-darkMuted/20 active:ring-darkMuted/30'>
									Listen on
									<img
										alt='listen on spotify'
										src='https://cdn.simpleicons.org/Spotify'
										className='mx-1 inline-block w-4'
									/>
									Spotify
								</a>
							</div>
						)}

						{/* miniToggle */}
						{!miniPlayer && (
							<div className='pointer-events-none relative -mx-4 -my-4 h-4 bg-vibrant/50 before:absolute before:inset-0 before:rounded-b-xl before:border-b before:border-b-vibrant/60 before:bg-darkVibrant before:shadow-md before:content-[""] group-[.withCanvas]:-mt-20 group-[.withCanvas]:h-20 group-[.withCanvas]:bg-transparent group-[.withCanvas]:before:bg-transparent group-[.withCanvas]:before:shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),_0_2px_4px_-2px_rgb(0_0_0_/_0.1),0_4rem_0_0_rgba(var(--vibrant)/.5)]'></div>
						)}
						{!miniPlayer ? (
							<div className='-m-4 mt-0 rounded-b-lg bg-vibrant/50 p-3 text-center group-[.withCanvas]:bg-transparent'>
								<div
									onClick={() => setMiniPlayer(!miniPlayer)}
									className='mx-auto h-8 w-max cursor-pointer rounded-full bg-darkMuted px-4 hover:ring-4 hover:ring-darkVibrant/20 active:ring-darkVibrant/30'>
									<svg
										className='h-full w-auto'
										xmlns='http://www.w3.org/2000/svg'
										viewBox='0 -960 960 960'
										fill='currentColor'>
										<path d='M480-360 280-560h400L480-360Z' />
									</svg>
								</div>
							</div>
						) : (
							<div
								onClick={() => setMiniPlayer(!miniPlayer)}
								className='absolute inset-0'></div>
						)}
					</div>
					{track.color && canvas && analyser && (
						<div className={`${paused ? 'audioPaused' : ''} h-28 duration-300 ease-out [&.audioPaused]:h-0 [&.audioPaused]:opacity-0 [&.audioPaused]:delay-300`}>
							<Viz
								audio={audio}
								canvas={canvas}
								analyser={analyser}
								Colors={[track.color.darkVibrant?.background.split(' '), track.color.lightVibrant?.background.split(' ')]}
							/>
						</div>
					)}
				</div>
			)}
		</>
	);
}
