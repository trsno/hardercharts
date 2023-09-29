import cheerio from 'cheerio';
import { cache } from 'react';

const scrapeTracks = async () => {
	const HSURL = process.env.HSURL;
	const HCURL = process.env.HCURL;
	try {
		const fetchTracks = cache(async () => {
			const [hsResponse, hcResponse] = await Promise.all([fetch(HSURL!, { next: { revalidate: 3600 } }), fetch(HCURL!, { next: { revalidate: 3600 } })]);
			const tracks = await Promise.all([scrape(await hsResponse.text(), true), scrape(await hcResponse.text(), false)]).catch(error => error);
			if (tracks instanceof Error) throw tracks;
			return { ...tracks[0], ...tracks[1] };
		});
		return await fetchTracks();
	} catch (error) {
		return new Error(`(scrape) → ${error}`);
	}
};
export default scrapeTracks;

function scrape(data: string, isHS: boolean) {
	const HS = isHS;
	return new Promise((resolve, reject) => {
		try {
			const $ = cheerio.load(data, { decodeEntities: true });
			const tracks: { [key: string]: any } = {};

			const titleMix = (titleText: string) => {
				const MixesRemove = ['Original Mix', 'Extended Mix', 'Pro Mix'];
				titleText = titleText.replace(new RegExp(`\\s*\\((${MixesRemove.join('|')})\\)`, 'gi'), '').trim();
				const mix = titleText.match(/\(([^)]+)\)/);
				const title = titleText.replace(/\([^)]+\)/g, '');
				return [mix ? mix[1] : null, title];
			};
			for (let i = 0; i < 40; i++) {
				const element = HS ? $('#column-middle .top40 + table.list tr:odd')[i] : $('.panel-body .release-list-item')[i];
				const url = HS
					? String($(element).find('.num > a').attr('href'))
					: String($(element).find('.release-list-item-info > .release-list-item-info-primary > .release-list-item-title > a').attr('href'));
				const id = HS ? String(url?.split('/').pop()) : String(url?.split('/').pop());
				const HSmix = $(element).find('.text-1 > a > b:nth-of-type(2)');
				const artistElement = HS ? $(element).find('.text-1 > a > span') : $(element).find('.release-list-item-info > .release-list-item-info-primary > .release-list-item-artist');

				const titleText = HS
					? `${$(element).find('.text-1 > a > b:first-child').text()}${HSmix.length ? '(' + HSmix.text() + ')' : ''}`
					: $(element).find('.release-list-item-info > .release-list-item-info-primary > .release-list-item-title').text();
				const [mix, title] = titleMix(titleText);
				const artist = HS
					? {
							full: artistElement.text(),
							list: artistElement.text().split(', ')
					  }
					: {
							full: artistElement.text(),
							list: Array.from({ length: artistElement.find('a').length }, (_, k) => {
								return $(artistElement.find('a:nth-child(' + (k + 1) + ')')).text();
							})
					  };
				const spectrum = HS
					? 'https://spectrums.content.hardstyle.com/spectrums/0/' + id?.replace(/(.{3})0?/, '$1/') + '/spectrum.png'
					: 'https://content.hardtunes.com/products/' + id + '/spectrum.png';
				const cover = HS
					? 'https:' + $(element).find('.image > a > img').attr('src')?.replace('/48x48/', '/500x500/')
					: $(element).find('.release-list-item-artwork > a > img').attr('data-src')?.replace('/248x248.jpg', '/original.jpg');
				const audio = HS ? 'https://preview.content.hardstyle.com/index2.php?id=' + id : null;

				const releaseDateElement = $(element).find('.release-list-item-info > .release-list-item-info-secondary > .release-list-item-release-date');
				let releaseDate = null;
				try {
					if (!HS) releaseDate = new Date(releaseDateElement.text().replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$2 $1 $3')).toISOString();
				} catch (error) {
					if (!HS) releaseDate = releaseDateElement.text();
				}

				const label = HS ? null : $(element).find('.release-list-item-info > .release-list-item-info-primary > .release-list-item-label').text();
				const pos = {
					curr: i,
					prev: i,
					peak: i,
					entry: Date.now()
				};
				tracks[id] = { url, artist, title, mix, cover, spectrum, audio, releaseDate, label, pos, isHS: HS };
			}
			resolve(tracks);
		} catch (error) {
			reject(error);
		}
	});
}
