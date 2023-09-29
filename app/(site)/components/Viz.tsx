import { useEffect, useRef } from 'react';

const closestPowerOfTwo = (number: number) => {
	const nearestSmallerPower = Math.pow(2, Math.floor(Math.log2(number)));
	const nearestLargerPower = Math.pow(2, Math.ceil(Math.log2(number)));
	if (Math.abs(number - nearestSmallerPower) < Math.abs(number - nearestLargerPower)) {
		return nearestSmallerPower;
	} else {
		return nearestLargerPower;
	}
};

const getColorDiffs = (color1: string[], color2: string[]) => {
	return color2.map((color, i) => +color - +color1[i]);
};

function oncanplayFn(Colors: (string[] | undefined)[], canvas: HTMLCanvasElement, analyser: AnalyserNode) {
	const backgroundColor = () => getComputedStyle(document.documentElement).getPropertyValue('--background');
	const darkMode = document.documentElement.dataset.theme?.includes('dark');
	const [c0, c1] = darkMode ? Colors : Colors.reverse();
	if (!analyser || !canvas || !c0 || !c1) return;
	const [rd, gd, bd] = getColorDiffs(c0, c1);

	const [r0, g0, b0] = c0;
	const [r1, g1, b1] = c1;
	const vizWidth = 320; //window.innerWidth
	const vizAspectRatio = 1 / 3;

	// analyser.minDecibels = -80;
	analyser.maxDecibels = -18;
	analyser.fftSize = closestPowerOfTwo(vizWidth);
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	canvas.width = vizWidth;
	canvas.height = vizWidth * vizAspectRatio;
	const ctx = canvas.getContext('2d');
	const WIDTH = canvas.width / 2;
	const HEIGHT = canvas.height;
	const barWidth = (WIDTH / bufferLength) * 2.5;
	let barHeight;
	let xl = 0;
	let xr = WIDTH;

	function renderFrame() {
		if (analyser && ctx) {
			xl = WIDTH;
			xr = WIDTH;
			analyser.getByteFrequencyData(dataArray);
			if (!ctx) return;
			ctx.fillStyle = `rgb(${backgroundColor()})`;
			ctx.fillRect(0, 0, WIDTH * 2, HEIGHT);

			for (let i = 0; i < bufferLength; i++) {
				const freq = dataArray[i] / 255;
				barHeight = (freq - 0.5) * 2 * HEIGHT;
				barHeight = barHeight < 0 ? 0 : barHeight;
				const y = (HEIGHT - barHeight) / 2;

				const r = +r0 + +rd * (1 - i / bufferLength);
				const g = +g0 + +gd * (1 - i / bufferLength);
				const b = +b0 + +bd * (1 - i / bufferLength);

				// ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${1})`;

				const grd = ctx.createLinearGradient(0, y * 2, 0, barHeight);
				grd.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
				grd.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
				grd.addColorStop(1, `rgb(${r1}, ${g1}, ${b1})`);
				// Fill with gradient
				ctx.fillStyle = grd;

				// center to the right ->
				ctx.fillRect(xl, y, barWidth, barHeight);
				ctx.fillRect(xr, y, barWidth, barHeight);

				// center to the right ->
				ctx.fillStyle = `rgba(${rd}, ${gd}, ${bd}, ${freq / 2})`;
				ctx.fillRect(xl, y - 2, barWidth, 1);
				ctx.fillRect(xr, y - 2, barWidth, 1);

				// center to the right ->
				ctx.fillRect(xl, y + barHeight + 1, barWidth, 1);
				ctx.fillRect(xr, y + barHeight + 1, barWidth, 1);
				xl += barWidth + 1;
				xr -= barWidth + 1;

				//
			}
			requestAnimationFrame(renderFrame);
		}
	}
	renderFrame();
}

export default function Viz({ audio, Colors, canvas, analyser }: { analyser: AnalyserNode; canvas: HTMLCanvasElement; audio: HTMLAudioElement; Colors: (string[] | undefined)[] }) {
	//
	const Viz = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (Viz.current) Viz.current.appendChild(canvas);
		const runOnCanPlay = () => oncanplayFn(Colors, canvas, analyser);
		audio.addEventListener('canplay', runOnCanPlay, true);
		return () => {
			audio.removeEventListener('canplay', runOnCanPlay, true);
		};
	}, [Colors, analyser, audio, canvas]);

	return <div ref={Viz}></div>;
}
