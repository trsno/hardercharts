import { getTracks } from '@/sanity/sanity-utils';
import Image from 'next/image';
import './check.css';
export default async function Home() {
	const tracks = await getTracks();
	return (
		<main>
			<h1 className='text-4xl font-bold'>total of {tracks.length} tracks</h1>
			<input
				type='checkbox'
				defaultChecked={false}></input>
			<br />
			<br />
			{tracks.map(track => {
				const { _id, artist, title, mix, releaseDate, label, spotify, canvas, isHS } = track;
				const cover = track.cover as string;
				const audio = track.audio as string;
				return (
					<div
						key={_id}
						className={`${
							track._id === null ||
							track.artist === null ||
							track.title === null ||
							track.cover === null ||
							track.audio === null ||
							track.spotify === null ||
							track.canvas === null ||
							track.releaseDate === null ||
							track.label === null
								? 'empty'
								: 'complete'
						}`}>
						<div className={`${_id ? '' : 'red'}`}>
							<div>_id</div>
							<div>{_id && _id}</div>
						</div>
						{artist && (
							<>
								<div className={`${artist.full ? '' : 'red'}`}>
									<div>artist.full</div>
									<div>{artist.full && artist.full}</div>
								</div>
								<div className={`${artist.list ? '' : 'red'}`}>
									<div>artist.list</div>
									<div>{artist.list && artist.list}</div>
								</div>
							</>
						)}
						<div className={`${title ? '' : 'red'}`}>
							<div>title</div>
							<div className='text-lg font-bold'>{title && title}</div>
						</div>
						<div>
							<div>mix</div>
							<div>{mix && mix}</div>
						</div>
						<div className={`${label ? '' : 'red'}`}>
							<div>label</div>
							<div>{label && label}</div>
						</div>
						<div className={`${releaseDate ? '' : 'red'}`}>
							<div>releaseDate</div>
							<div>{releaseDate && releaseDate}</div>
						</div>
						<div className={`${spotify ? '' : 'red'}`}>
							<div>spotify</div>
							<div>{spotify && spotify}</div>
						</div>
						<div className={`${canvas ? '' : 'red'}`}>
							<div>canvas</div>
							<div>{canvas && canvas}</div>
						</div>
						<div>
							<div>isHS</div>
							<div>{isHS && isHS}</div>
						</div>
						<div className={`${cover ? '' : 'red'}`}>
							<div>cover</div>
							<div>
								{cover && (
									<Image
										src={cover}
										alt={title}
										width={200}
										height={200}
									/>
								)}
							</div>
						</div>
						<div className={`${audio ? 'audio' : 'red'}`}>
							<div>audio</div>
							<div>
								{audio && (
									<audio
										preload='none'
										src={audio}
										controls></audio>
								)}
							</div>
						</div>
						{spotify && <iframe src={'https://open.spotify.com/embed/track/' + spotify}></iframe>}
					</div>
				);
			})}
		</main>
	);
}
