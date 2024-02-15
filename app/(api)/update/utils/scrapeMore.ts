import { Track } from '@/sanity/sanity-utils';
import cheerio from 'cheerio';
export default async function scrapeMore(dbTracks: { [x: string]: Track }, tracks: { [x: string]: Track }) {
	await Promise.all(
		Object.keys(tracks).map(async id => {
			const track = tracks[id];
			const dbTrack = dbTracks[id] ?? track;
			if (!track.url) return;
			if (track.isHS && (!dbTrack.releaseDate || !dbTrack.label || !dbTrack.audio)) {
				const data = await fetch(track.url);
				const $ = cheerio.load(await data.text());
				const label = $('.extraInfo a.link.label').text();
				const date = $('.extraInfo span.date').text().split('.')
				const releaseDate = new Date(`${date[1]} ${date[0]} ${date[2]}`).getTime();

				if (!label || !releaseDate) throw new Error(`Cant get Metadata for ${id}`);
				track.label = label;
				track.releaseDate = new Date(releaseDate).toISOString();
				track.audio = JSON.parse($('script[type="application/ld+json"]:first').text()).audio
				console.log(`[ ${id} ] ➡ ${label}, ${releaseDate}`);
			}

			if (!track.isHS && !(dbTrack.audio as string)?.includes('cdn.sanity')) {
				const data = await fetch(track.url);
				const $ = cheerio.load(await data.text());
				const audio = $('link[itemprop="audio"]').attr('href');
				if (!audio) throw new Error(`Cant get audio for ${id}`);
				track.audio = audio;

				console.log(`   [ ${id} ] ➡ ${audio}`);
			}
		})
	);
}
