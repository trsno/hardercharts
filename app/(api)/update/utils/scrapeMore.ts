import { Track } from '@/sanity/sanity-utils';
import cheerio from 'cheerio';
export default async function scrapeMore(dbTracks: { [x: string]: Track }, tracks: { [x: string]: Track }) {
	await Promise.all(
		Object.keys(tracks).map(async id => {
			const track = tracks[id];
			const dbTrack = dbTracks[id] ?? track;
			if (!track.url) return;
			if (track.isHS && (!dbTrack.releaseDate || !dbTrack.label)) {
				const data = await fetch(track.url);
				const $ = cheerio.load(await data.text());
				const artistElement = $('.product-info>.info > h1');
				const isMultipleArtist = artistElement.find('a').length > 1;

				const artist = isMultipleArtist
					? { full: track.artist.full, list: Array.from({ length: artistElement.find('a').length }, (_, k) => $(artistElement.find('a:nth-child(' + (k + 1) + ')')).text()) }
					: track.artist;

				const label = $('.product-info>.info>a:first').text();
				const releaseDate = new Date(
					$('.product-info>.info')
						.text()
						?.split('Date:')[1]
						?.split('Length:')[0]
						.replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$2 $1 $3')
				).getTime();

				if (!label || !releaseDate) throw new Error(`Cant get Metadata for ${id}`);
				track.label = label;
				track.releaseDate = new Date(releaseDate).toISOString();
				track.artist = artist;

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
