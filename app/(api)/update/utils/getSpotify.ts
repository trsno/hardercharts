import { Client } from 'spotify-api.js';
import getCanvas from './getCanvas';
import { Track } from '@/sanity/sanity-utils';

export default async function getSpotify(tracks: { [x: string]: Track }) {
	try {
		const getSpotifyIDs = Object.keys(tracks).map(async id => {
			const track = tracks[id];
			if (track.spotify) return null;
			const Spotify = await Client.create({ token: { clientID: process.env.CLIENTID ?? '', clientSecret: process.env.CLIENTSECRET ?? '' } });

			const whitespaceCleanup = (str: string) => str.replace(/(^\s+|\s+$|\s+(?=\s))/g, '');
			const toAlphanumeric = (str: string) => str.replace(/(^|\s)(and|&|featuring|feat\.|ft\.|x)(?=\s|$)/gi, '');
			const toAlphanumeric3 = (str: string) => str.replace(/(^|\s)(featuring|feat\.|ft\.|x)(?=\s|$)/gi, '');
			const toAlphanumeric2 = (str: string) => toAlphanumeric(str.replace(/[^a-zA-Z0-9\s]/g, ''));

			const artistQuery = whitespaceCleanup(track.artist.list.join(' ')).toLowerCase();
			const titleQuery = whitespaceCleanup(track.title);
			const mixQuery = track.mix ? ` ${whitespaceCleanup(track.mix)}` : '';
			const queries = [
				`${toAlphanumeric(artistQuery).toLowerCase()} ${toAlphanumeric(titleQuery).toLowerCase()}${toAlphanumeric(mixQuery).toLowerCase()}`,
				`artist:${toAlphanumeric(artistQuery)} track:${toAlphanumeric(titleQuery)} ${toAlphanumeric(mixQuery)}`,
				`${toAlphanumeric(artistQuery)} - ${toAlphanumeric(titleQuery)}${toAlphanumeric(mixQuery)}`,
				`${toAlphanumeric(artistQuery).toLowerCase()} - ${toAlphanumeric(titleQuery).toLowerCase()}${toAlphanumeric(mixQuery).toLowerCase()}`,
				`${toAlphanumeric3(artistQuery)} - ${toAlphanumeric(titleQuery)}${toAlphanumeric(mixQuery)}`,
				`${toAlphanumeric(artistQuery).toLowerCase()} - ${toAlphanumeric(titleQuery)}${toAlphanumeric(mixQuery)}`,
				`${toAlphanumeric(artistQuery)} - ${toAlphanumeric(titleQuery)}`
			];
			let exactMatchIsFound = false;

			const compareArrays = (arr1: string[], arr2: string[]) => {
				const cleanStr = (str: string[]) =>
					str
						.join(' ')
						.trim()
						.toLowerCase()
						.split(/\s/)
						.filter((x: string) => x);
				const set1 = new Set(cleanStr(arr1));
				const set2 = new Set(cleanStr(arr2));
				const set1Arr = Array.from(set1);
				const set2Arr = Array.from(set2);
				// console.log(`| ➡ RESULT: ${set1Arr}\n| ➡ QUERY : ${set2Arr}\n| ----------`);
				const commonCount = set1Arr.filter(item => set2.has(item)).length;
				const uncommonCount = arr1.length + arr2.length - 2 * commonCount;
				const exact = set1Arr.every(item => set2Arr.includes(item)) && set2Arr.every(item => set1Arr.includes(item));
				return { result: commonCount * 2 - uncommonCount, exact };
			};

			const fetchID = async (query: string): Promise<null | { id: string; score: number }> => {
				const spotifyResponse = await Spotify.tracks.search(query, { limit: 3 }).catch((err: Error) => {
					throw err;
				});
				if (!Array.isArray(spotifyResponse)) console.log(`  🗯 (getSpotifyData)	→ no result → query : [${query}]`);
				const trackScores = spotifyResponse.map((track, index) => {
					// console.log(`${index === 0 ? ',' : '|'}------------------------------------------------`);
					const artistFromResult = track.artists.map(x => toAlphanumeric2(whitespaceCleanup(x.name)));
					const artistFromQuery = toAlphanumeric2(artistQuery).split(/\s/);
					const titleFromResult = toAlphanumeric2(track.name)
						.split(/\s/)
						.map(x => whitespaceCleanup(x));
					const titleFromQuery = toAlphanumeric2(`${titleQuery} ${mixQuery}`)
						.split(/\s/)
						.filter(x => x);

					const artistMatched = compareArrays(artistFromResult, artistFromQuery);
					const titleMatched = compareArrays(titleFromResult, titleFromQuery);
					if (!exactMatchIsFound) exactMatchIsFound = artistMatched.exact && titleMatched.exact;
					// console.log(`| 🆔 : ${track.id} \n| 🪞 EXACT: ${artistMatched.exact && titleMatched.exact}`);
					const isASingle = track.album?.albumType === 'single' ? 1.7 : track.album?.albumType === 'album' ? 1.4 : 1;
					const score = (artistMatched.result + titleMatched.result - index) * isASingle || isASingle;
					// console.log(`| 🧲 SCORES: ${(score).toFixed(2)}`);
					return score;
				});
				// console.log('|------------------------------------------------');
				const bestIndex = trackScores.indexOf(Math.max(...trackScores));
				// console.log(
				// 	`|\n| 🔰 QUERY: \n|\n|	${query} \n|\n| 🔰 Results: ${spotifyResponse.length} track(s) \n| 🔰 BestIndex: ${bestIndex} \n\`------------------------------------------------\n\n`
				// );
				const nextTrack = spotifyResponse[bestIndex];
				if (!nextTrack || !nextTrack.id || !nextTrack.previewURL) return null;
				if (typeof track.releaseDate !== 'number') {
					track.releaseDate = nextTrack.album?.releaseDate!;
				}
				return nextTrack?.id ? { id: nextTrack?.id, score: trackScores[bestIndex] } : null;
			};

			const BestIDs = [];
			for (const query of queries) {
				if (exactMatchIsFound) break;
				const res = await fetchID(query);
				if (res) BestIDs.push(res);
			}

			const spotifyID = BestIDs.length
				? BestIDs.reduce(
						(acc, track, i) => {
							if (i == 0) acc = track;
							if (track.score > acc.score) acc = track;
							// console.log(track);
							return acc;
						},
						{ id: '0', score: 0 }
				  ).id
				: null;
				// console.log(`🏁 winner: ${spotifyID}`);

			if (spotifyID) {
				track.spotify = spotifyID;
			}
			return spotifyID;
		});

		// get spotify IDs
		const fetchSpotifyIDs = await Promise.all(getSpotifyIDs).catch(error => error);
		if (fetchSpotifyIDs instanceof Error) throw fetchSpotifyIDs;

		// from the spotify IDs, get spotify Canvas
		if (!Array.isArray(fetchSpotifyIDs)) return;
		const IDs = fetchSpotifyIDs.filter((id: string | null) => id);
		if (IDs.length <= 0) return;

		const canvases = await getCanvas(IDs); // : {}
		const applyCanvases = await Promise.all(
			Object.keys(tracks).map(async id => {
				const track = tracks[id];
				const spotifyID = track.spotify;
				if (spotifyID && Object.keys(canvases).includes(spotifyID)) {
					const canvas = canvases[spotifyID];
					track.canvas = canvas;
				}
			})
		).catch(error => error);
		if (applyCanvases instanceof Error) throw applyCanvases;

		return 0;
	} catch (error) {
		return new Error(`(getSpotifyData) → ${error}`);
	}
}
