const CANVASES_URL = 'https://spclient.wg.spotify.com/canvaz-cache/v0/canvases';
import axios, { AxiosRequestConfig } from 'axios';
// @ts-ignore
import canvas from './_canvas_pb.cjs';

async function requestpb(uris: string[], accessToken: string) {
	try {
		// @ts-ignore
		const canvasRequest = new canvas.CanvasRequest();
		for (const uri of uris) {
			// @ts-ignore
			const spotifyTrack = new canvas.CanvasRequest.Track();
			spotifyTrack.setTrackUri(uri);
			canvasRequest.addTracks(spotifyTrack);
		}
		const requestBytes = canvasRequest.serializeBinary();

		const options: AxiosRequestConfig = {
			responseType: 'arraybuffer',
			headers: {
				accept: 'application/protobuf',
				'content-type': 'application/x-www-form-urlencoded',
				'accept-language': 'en',
				'user-agent': 'Spotify/8.5.49 iOS/Version 13.3.1 (Build 17D50)',
				'accept-encoding': 'gzip, deflate, br',
				authorization: `Bearer ${accessToken}`
			}
		};
		return axios
			.post(CANVASES_URL, requestBytes, options)
			.then((response) => {
				if (response.statusText !== 'OK') {
					console.log(`ERROR ${CANVASES_URL}: ${response.status} ${response.statusText}`);
					if (response.data.error) {
						console.log(response.data.error);
					}
				} else {
					// @ts-ignore
					return canvas.CanvasResponse.deserializeBinary(response.data).toObject();
				}
			})
			.catch((error) => console.log(`ERROR ${CANVASES_URL}: ${error}`));
	} catch (error) {
		console.log(error);
		return error;
	}
}

async function getOpenToken() {
	return await fetch('https://open.spotify.com/get_access_token?reason=transport&productType=web_player')
		.then((d) => d.json())
		.then((data) => {
			return data.accessToken;
		})
		.catch((error) => {
			console.error('ERROR /openToken', error);
			return error;
		});
}

export default async function getCanvas(IDs: string[]): Promise<{ [key: string]: string }> {
	try {
		const ACCESS_TOKEN = await getOpenToken();
		const tracks = IDs.map((track) => `spotify:track:${track}`);

		const fetchCanvases = await requestpb(tracks, ACCESS_TOKEN);
		if (fetchCanvases instanceof Error) throw new Error('(requestpb) → ' + fetchCanvases);

		const canvases: { [key: string]: string } = {}; // return this
		fetchCanvases.canvasesList.map((track: { trackUri: string; canvasUrl: string }) => {
			canvases[track.trackUri.replace('spotify:track:', '')] = track.canvasUrl;
		});
		return canvases;
	} catch (error) {
		return { 'message': `(canvas) → [ ${IDs} ] → ${error}` }
	}
}