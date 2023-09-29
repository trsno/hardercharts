const Tracks = {
	name: 'track',
	type: 'document',
	title: 'Tracks',
	fields: [
		{
			name: 'artist',
			type: 'object',
			title: 'Artist',
			fields: [
				{
					name: 'full',
					type: 'string',
					title: 'Full Text'
				},
				{
					name: 'list',
					type: 'array',
					title: 'List',
					of: [{ type: 'string' }]
				}
			]
		},
		{
			name: 'pos',
			type: 'object',
			title: 'Position',
			fields: [
				{ name: 'curr', type: 'number', title: 'Current' },
				{ name: 'prev', type: 'number', title: 'Prev' },
				{ name: 'peak', type: 'number', title: 'Peak' },
				{ name: 'entry', type: 'number', title: 'Entry' }
			]
		},
		{ name: 'audio', type: 'file', title: 'Audio Preview' },
		{ name: 'cover', type: 'image', title: 'Cover' },
		{ name: 'title', type: 'string', title: 'Track Title' },
		{ name: 'mix', type: 'string', title: 'Mixed by' },
		{ name: 'spotify', type: 'string', title: 'Spotify ID' },
		{ name: 'canvas', type: 'url', title: 'CanvasURL' },
		{ name: 'releaseDate', type: 'datetime', title: 'Release Date' },
		{ name: 'label', type: 'string', title: 'Label' },
		{ name: 'isHS', type: 'boolean', title: 'is Hardstyle' }
	]
};
export default Tracks;
