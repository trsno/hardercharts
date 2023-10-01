import { Track, deleteAsset, deleteDocument, getTracksForUpdate, updatePos } from '@/sanity/sanity-utils';
import { NextRequest, NextResponse } from 'next/server';
import getSpotify from './utils/getSpotify';
import postTracks from './utils/postTracks';
import scrapeMore from './utils/scrapeMore';
import scrapeTracks from './utils/scrapeTracks';

export const revalidate = 0;

export async function GET(req: NextRequest) {
	console.log('-- Updating --------------------------------');
	console.time('-- All Done Sir ----------------------------');
	console.time('⚜  Getting new Tracks');
	const tracks = await scrapeTracks();
	console.timeEnd('⚜  Getting new Tracks');
	console.log(`   loaded [ ${Object.keys(tracks).length} ] tracks`);

	console.time('⚜  Getting db Tracks');
	const dbTracks = await getTracksForUpdate();
	const dbTrackObj: { [key: string]: Track } = dbTracks.reduce((acc, track) => {
		return { ...acc, [track._id]: track };
	}, {});
	const dbTracksIDs = dbTracks.map(t => t._id);

	const emptyValueTracks = dbTracks
		.filter(track => {
			return (
				track._id === null ||
				track.artist === null ||
				track.title === null ||
				track.cover === null ||
				track.audio === null ||
				track.spotify === null ||
				track.releaseDate === null ||
				track.label === null ||
				track.color === null
			);
		})
		.map(track => track._id);
	const TracksChangingPos = Object.keys(tracks)
		.filter(id => dbTracksIDs.includes(id))
		.filter(id => tracks[id].pos.curr !== dbTrackObj[id].pos.curr)
		.filter(id => !emptyValueTracks.includes(id));
	console.timeEnd('⚜  Getting db Tracks');
	console.log(`   loaded [ ${dbTracks.length} ] tracks`);

	console.time('⚜  Updating Position');
	const updatePosQueue = [];
	const updatePosition = async (id: string) => {
		const newTrackPos = tracks[id].pos;
		const prevTrackPos = dbTrackObj[id].pos;
		const posDoc = {
			_id: id,
			pos: {
				curr: newTrackPos.curr,
				prev: prevTrackPos.curr,
				entry: Math.min(prevTrackPos.entry, newTrackPos.entry),
				peak: Math.min(prevTrackPos.peak, newTrackPos.curr)
			}
		};
		console.log(`⌖ [${id}] updating position, prev: ${prevTrackPos.curr}, curr: ${newTrackPos.curr}`);
		await updatePos(posDoc);
	};
	for (let i = 0; i < TracksChangingPos.length; i++) {
		updatePosQueue.push(TracksChangingPos[i]);
		if (updatePosQueue.length === 20 || i === TracksChangingPos.length - 1) {
			await Promise.all(updatePosQueue.map(updatePosition));
			updatePosQueue.length = 0;
		}
	}
	console.timeEnd('⚜  Updating Position');

	const toDelete = Object.keys(tracks).length === 80 ? dbTracksIDs.filter(id => !Object.keys(tracks).includes(id)) : [];
	console.log('🧨 tracks to Delete :', toDelete.length);

	Object.keys(tracks).forEach(id => {
		if (!emptyValueTracks.includes(id) && dbTracksIDs.includes(id)) delete tracks[id];
	});

	console.log('🎲 tracks to Process:', Object.keys(tracks).length);
	emptyValueTracks.map(id => {
		const track = dbTrackObj[id];
		if (track._id === null) console.log(`   [${track._id}] no _id`);
		if (track.artist === null) console.log(`   [${track._id}] no artist`);
		if (track.title === null) console.log(`   [${track._id}] no title`);
		if (track.cover === null) console.log(`   [${track._id}] no cover`);
		if (track.audio === null) console.log(`   [${track._id}] no audio`);
		if (track.spotify === null) console.log(`   [${track._id}] no spotify`);
		if (track.releaseDate === null) console.log(`   [${track._id}] no releaseDate`);
		if (track.label === null) console.log(`   [${track._id}] no label`);
		if (track.color === null) console.log(`   [${track._id}] no color`);
	});

	dbTracks.map(track => {
		const id = track._id;
		const newTrack = tracks[id];
		if (newTrack) {
			const newTrackPos = newTrack.pos;
			const prevTrackPos = track.pos;
			newTrackPos.curr = newTrackPos.curr;
			newTrackPos.prev = prevTrackPos.curr;
			newTrackPos.entry = Math.min(prevTrackPos.entry, newTrackPos.entry);
			newTrackPos.peak = Math.min(prevTrackPos.peak, newTrackPos.curr);
		}
	});

	console.time('⚜  Scraping More Data');
	await scrapeMore(dbTrackObj, tracks);
	console.timeEnd('⚜  Scraping More Data');

	console.time('⚜  Getting spotify ID and Canvas');
	await getSpotify(tracks);
	console.timeEnd('⚜  Getting spotify ID and Canvas');

	console.time('⚜  Uploading Files and Doc');
	await postTracks(dbTrackObj, tracks);
	console.timeEnd('⚜  Uploading Files and Doc');

	const arr = toDelete;
	const parallelLimit = 20;
	const taskQueue = [];
	const deleteTrack = async (id: string) => {
		await deleteDocument(id);
		await deleteAsset(`${id}.mp3`);
		await deleteAsset(`${id}.jpg`);
	};

	console.time('⚜  Deleting Unused Files and Doc');
	for (let i = 0; i < arr.length; i++) {
		taskQueue.push(arr[i]);
		if (taskQueue.length === parallelLimit || i === arr.length - 1) {
			await Promise.all(taskQueue.map(deleteTrack));
			taskQueue.length = 0;
		}
	}
	console.timeEnd('⚜  Deleting Unused Files and Doc');
	console.timeEnd('-- All Done Sir ----------------------------');
	return NextResponse.json(tracks);
}
