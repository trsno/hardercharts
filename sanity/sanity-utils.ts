import { UploadBody, createClient, groq } from 'next-sanity';
import config from '@/sanity.config';
import { ImagePalette } from 'sanity';

const readClient = createClient({
	...config,
	useCdn: true
});

const writeClient = createClient({
	...config,
	token: process.env.SANITY_SECRET_TOKEN,
	useCdn: false
});

export type Track = {
	_id: string;
	_createdAt?: Date;
	_updatedAt?: Date;
	url?: string;
	artist: { full: string; list: string[] };
	title: string;
	mix: string;
	cover?: { _type: string; asset: { _type: string; _ref: string } } | string;
	color?: ImagePalette;
	audio?: { _type: string; asset: { _type: string; _ref: string } } | string;
	pos: { curr: number; prev: number; peak: number; entry: number; changes?: number; status?: string; trend?: string };
	spotify: string;
	canvas: string;
	releaseDate: string;
	label: string;
	isHS: boolean;
	curr?: number;
	prev?: number;
	peak?: number;
	entry?: number;
	changes?: number;
	status?: string;
	trend?: string;
};

function hexToRgb(hex: string) {
	const intValue = parseInt(hex.replace(/^#/, ''), 16);
	const r = (intValue >> 16) & 255;
	const g = (intValue >> 8) & 255;
	const b = intValue & 255;
	return `${r} ${g} ${b}`;
}

export async function getTrack(id: string): Promise<Track> {
	return await readClient.fetch(
		groq`*[_type=='track' && _id=='${id}'][0]{
			_id,
			_createdAt,_updatedAt,
			artist,
			title,
			mix,
			pos,
			'cover': cover.asset -> url,
			'audio': audio.asset -> url,
			spotify,
			canvas,
			releaseDate,
			label,
			isHS,
			'color': cover.asset -> metadata.palette
		}`
	);
}
export async function getTracks(): Promise<Track[]> {
	const tracks = await readClient.fetch(
		groq`*[_type=='track']{
			_id,
			_createdAt,_updatedAt,
			artist,
			title,
			mix,
			pos,
			'cover': cover.asset -> url,
			'audio': audio.asset -> url,
			'color': cover.asset -> metadata.palette,
			spotify,
			canvas,
			releaseDate,
			label,
			isHS,
		}`
	);
	return tracks.map((track: { cover: any; color: { [x: string]: { [x: string]: string } } }) => {
		if (!track.cover) return track;
		return {
			...track,
			color: Object.keys(track.color).reduce((acc: { [key: string]: { [key: string]: string } }, palette) => {
				if (palette === '_type') return acc;
				acc[palette] = {
					foreground: track.color[palette]['foreground'] === '#fff' ? 'var(--white)' : 'var(--black)',
					background: hexToRgb(track.color[palette]['background'])
				};
				return acc;
			}, {})
		};
	});
}

export async function getTracksForUpdate(): Promise<Track[]> {
	return await writeClient.fetch(
		groq`*[_type=='track']{
			_id,
			_createdAt,_updatedAt,
			artist,
			title,
			mix,
			pos,
			'cover': cover.asset -> url,
			'audio': audio.asset -> url,
			'color': cover.asset -> metadata.palette,
			spotify,
			canvas,
			releaseDate,
			label,
			isHS,
		}`
	);
}

export async function setTrack(keys: Track) {
	const doc = {
		...keys,
		_type: 'track'
	};
	await writeClient.createIfNotExists(doc);
	await writeClient
		.patch(keys._id)
		.set({ ...doc })
		.commit();
}

export async function updatePos(keys: { _id: string; pos: { curr: number; prev: number; peak: number; entry: number } }) {
	const doc = {
		...keys,
		_type: 'track'
	};
	await writeClient
		.patch(keys._id)
		.set({ ...doc })
		.commit();
}

export async function uploadAsset(type: 'file' | 'image', data: UploadBody, id: string) {
	return await writeClient.assets
		.upload(type, data, { filename: type === 'file' ? `${id}.mp3` : `${id}.jpg` })
		.then(fileAsset => {
			return writeClient
				.patch(id)
				.set(
					type === 'file'
						? {
								audio: {
									_type: 'file',
									asset: {
										_type: 'reference',
										_ref: fileAsset._id
									}
								}
						  }
						: {
								cover: {
									_type: 'image',
									asset: {
										_type: 'reference',
										_ref: fileAsset._id
									}
								}
						  }
				)
				.commit();
		})
		.catch(error => error);
}

export async function deleteAsset(filename: string) {
	return await writeClient.delete(filename).then(result => {
		console.log('deleted asset', result);
	});
}

export async function deleteDocument(id: string) {
	return await writeClient.delete(id).then(console.log).catch(console.error);
}
