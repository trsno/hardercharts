import { Track, setTrack, uploadAsset } from '@/sanity/sanity-utils';
import axios from 'axios';

export default async function postTracks(dbTracks: { [x: string]: Track }, tracks: { [x: string]: Track }) {
	const uploadTrack = async (id: string) => {
		const track = tracks[id];
		const dbTrack = dbTracks[id] ?? track;
		const { artist, title, mix, cover, audio, spotify, canvas, releaseDate, label, isHS, pos } = track;

		const uploadFn = async (id: string, url: string, type: 'file' | 'image') => {
			console.time(`   ⬆ [ ${id}.${type === 'file' ? 'mp3' : 'jpg'} ] uploaded`);
			const fileBuffer = await axios
				.get(url, { responseType: 'arraybuffer' })
				.then(({ data }) => data)
				.catch(console.error);
			await uploadAsset(type, fileBuffer, id);
			console.timeEnd(`   ⬆ [ ${id}.${type === 'file' ? 'mp3' : 'jpg'} ] uploaded`);
		};

		await setTrack({
			_id: id,
			artist,
			title,
			mix,
			spotify,
			canvas,
			releaseDate,
			pos,
			label,
			isHS
		});

		if (!dbTrack.color || !(dbTrack.cover as string)?.includes('cdn.sanity')) await uploadFn(id, cover as string, 'image');
		if (!(dbTrack.audio as string)?.includes('cdn.sanity')) await uploadFn(id, audio as string, 'file');
	};

	const arr = Object.keys(tracks);
	const parallelLimit = 20;
	const taskQueue = [];
	for (let i = 0; i < arr.length; i++) {
		taskQueue.push(arr[i]);
		if (taskQueue.length === parallelLimit || i === arr.length - 1) {
			await Promise.all(taskQueue.map(uploadTrack));
			taskQueue.length = 0;
		}
	}
}
