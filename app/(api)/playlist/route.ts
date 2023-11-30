import { getTracksForUpdate } from '@/sanity/sanity-utils';
import { NextRequest, NextResponse } from 'next/server';

const fetchData = async (url: string, options: RequestInit) => {
	try {
		const response = await fetch(url, options);

		if (!response.ok) {
			throw new Error(`Request failed: ${response.statusText}`);
		}

		return await response.json();
	} catch (error) {
		if (error instanceof Error) {
			console.log('Request error:', error.message);
		} else {
			console.log('Unexpected error', error);
		}
	}
};

// const getToken = async () => {
// 	const tokenUrl = 'https://accounts.spotify.com/api/token';
// 	const tokenData = {
// 		grant_type: 'authorization_code',
// 		code: process.env.AUTHORIZATIONCODE,
// 		redirect_uri: process.env.REDIRECTURI,
// 		client_id: process.env.CLIENTID,
// 		client_secret: process.env.CLIENTSECRET
// 	};

// 	return await fetchData(tokenUrl, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/x-www-form-urlencoded'
// 		},
// 		body: new URLSearchParams(tokenData)
// 	});
// };

const refreshAccessToken = async (refresh_token: string) => {
	const tokenUrl = 'https://accounts.spotify.com/api/token';
	const basicAuth = btoa(`${process.env.CLIENTID}:${process.env.CLIENTSECRET}`);

	const requestBody = new URLSearchParams();
	requestBody.append('grant_type', 'refresh_token');
	requestBody.append('refresh_token', refresh_token);

	const options = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${basicAuth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: requestBody
	};

	try {
		const result = await fetchData(tokenUrl, options);
		console.log('Token refresh successful:', result);
		return result;
	} catch (error) {
		console.error('Token refresh failed:', error);
	}
};

const addTrackToPlaylist = async (accessToken: string, playlistId: string, trackUris: string[]) => {
	const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json'
	};
	const data = {
		uris: trackUris
	};

	console.log(`adding ${trackUris.length} new track(s) : [${trackUris}]`);

	return await fetchData(playlistUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify(data)
	});
};

const getPlaylistTrackIds = async (accessToken: string, playlistId: string) => {
	const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
	const headers = {
		Authorization: `Bearer ${accessToken}`
	};

	return await fetchData(playlistUrl, {
		method: 'GET',
		headers
	}).then(data => data.items.map((item: any) => item.track.id));
};

const removeTracksFromPlaylist = async (accessToken: string, playlistId: string, trackIds: string[]) => {
	const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json'
	};

	const data = {
		tracks: trackIds.map(trackId => ({ uri: `spotify:track:${trackId}` }))
	};

	console.log(`removing ${trackIds.length} old track(s) : [${trackIds}]`);

	return await fetchData(playlistUrl, {
		method: 'DELETE',
		headers,
		body: JSON.stringify(data)
	});
};

const reorderPlaylistTracks = async (accessToken: string, playlistId: string, newTrackOrder: string[]) => {
	const playlistUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
	const headers = {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json'
	};

	const data = {
		uris: newTrackOrder.map(trackId => `spotify:track:${trackId}`)
	};

	console.log(`reordering playlist [${playlistId}]`);
	return await fetchData(playlistUrl, {
		method: 'PUT',
		headers,
		body: JSON.stringify(data)
	});
};

const arraysEqual = (arr1: string[], arr2: string[]) => arr1.length === arr2.length && arr1.every((value, index) => value === arr2[index]);

const main = async () => {
	try {
		// const tokenData = await getToken();
		// const refreshToken = tokenData.refresh_token;
		// const accessToken = tokenData.access_token;

		const accessToken = (await refreshAccessToken(process.env.REFRESH_TOKEN!)).access_token;

		// Retrieve dbTracks from getTracksForUpdate
		const dbTracks = (await getTracksForUpdate())
			.sort((a, b) => a.pos.curr - b.pos.curr)
			.reduce(
				(acc, track) => {
					if (track.spotify) {
						if (track.isHS) {
							acc.hs.push(track.spotify);
						} else {
							acc.hc.push(track.spotify);
						}
					}
					return acc;
				},
				{ hs: [] as string[], hc: [] as string[] }
			);

		const currentPlaylistTracksHardstyle = await getPlaylistTrackIds(accessToken, process.env.PLAYLISTHARDSTYLE!);
		const currentPlaylistTracksHardcore = await getPlaylistTrackIds(accessToken, process.env.PLAYLISTHARDCORE!);

		const toRemoveHardstyle = currentPlaylistTracksHardstyle.filter((track: string) => !dbTracks.hs.includes(track));
		const toRemoveHardcore = currentPlaylistTracksHardcore.filter((track: string) => !dbTracks.hc.includes(track));

		const toAddHardstyle = dbTracks.hs.filter((track: string) => !currentPlaylistTracksHardstyle.includes(track)).map(id => 'spotify:track:' + id);
		const toAddHardcore = dbTracks.hc.filter((track: string) => !currentPlaylistTracksHardcore.includes(track)).map(id => 'spotify:track:' + id);

		await Promise.all([
			toRemoveHardstyle.length && removeTracksFromPlaylist(accessToken, process.env.PLAYLISTHARDSTYLE!, toRemoveHardstyle),
			toRemoveHardcore.length && removeTracksFromPlaylist(accessToken, process.env.PLAYLISTHARDCORE!, toRemoveHardcore),
			toAddHardstyle.length && addTrackToPlaylist(accessToken, process.env.PLAYLISTHARDSTYLE!, toAddHardstyle),
			toAddHardcore.length && addTrackToPlaylist(accessToken, process.env.PLAYLISTHARDCORE!, toAddHardcore),
			!arraysEqual(currentPlaylistTracksHardstyle, dbTracks.hs) && reorderPlaylistTracks(accessToken, process.env.PLAYLISTHARDSTYLE!, dbTracks.hs),
			!arraysEqual(currentPlaylistTracksHardcore, dbTracks.hc) && reorderPlaylistTracks(accessToken, process.env.PLAYLISTHARDCORE!, dbTracks.hc)
		]);

		return 'Success!';
	} catch (error) {
		if (error instanceof Error) {
			return 'Failed: ' + error.message;
		} else {
			return 'Failed: ' + error;
		}
	}
};

export async function GET(request: NextRequest) {
	const resp = await main();
	console.log(resp);
	return NextResponse.json(resp);
}
