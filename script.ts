import { sig } from "./solid_monke/solid_monke"
import QrScanner from 'qr-scanner';
import p5 from 'p5';
import * as tone from "tone"

let capture;
let corners
let mic
let capturing = true

let canvas = document.getElementById('p5')
let c_width = canvas?.clientWidth
let c_height = canvas?.clientHeight

let img, img_1, img_2

let graphic

let current = "spread_1"

let spreads = {
	spread_1: {
		image_grid: [img_1, 50, 50, 180, 290, () => counter],
	},

	spread_2: {
		image_grid: [img_1, 50, 50, 180, 290, () => counter],
	}
}


let grid_compare = Array.from({ length: 500 }, () => Array.from({ length: 500 }, () => Math.random()))


let counter = 0
let meter
setInterval(() => {
	counter++
}, 500)

let sketch = (p: p5) => {
	function draw_base() {
		if (capturing) {
			p.image(capture, 0, 0, c_width, c_height);
		}
	}

	function draw_pixel_grid(p, x: number, y: number, w: number, h: number, skip: number) {
		let size = 10
		let row = w / size
		let col = h / size

		let positive = "white"
		let negative = "black"
		p.noStroke()

		for (let i = 0; i < row; i++) {
			for (let j = 0; j < col; j++) {
				if (grid_compare[i][j] < skip / 100) {
					p.fill(positive)
					p.rect(x + (i * size), y + (j * size), size, size)
				}
				else {
					p.fill(negative)
					p.rect(x + (i * size), y + (j * size), size, size)
				}
			}
		}
	}

	function image_and_grid(img, x, y, w, h, skip) {
		if ("function" === typeof skip) skip = skip()
		if (!graphic) graphic = p.createGraphics(p.width, p.height)

		graphic.image(img, x, y, w, h)
		graphic.blendMode(p.SCREEN)
		graphic.blendMode(p.MULTIPLY)
		draw_pixel_grid(graphic, x, y, w, h, skip)
		graphic.blendMode(p.BLEND)

		p.blendMode(p.SCREEN)
		p.image(graphic, 0, 0)
		p.blendMode(p.BLEND)
	}

	function qr_code_init() {
		let options = ["spread_1", "spread_2", "spread_3", "spread_4"]
		setInterval(() => {
			let canvas = document.querySelector('canvas');
			if (!canvas) return;
			QrScanner.scanImage(canvas, { returnDetailedScanResult: true })
				.then(result => {
					let text = result.data
					corners = result.cornerPoints

					if (text !== current) {
						if (options.includes(text)) {
							counter = 0
						}
						if (text == "spread_1") {
							current = "spread_1"
						}
						if (text == "spread_2") {
							current = "spread_2"
						}

					}

				})
				.catch(error => {
					corners = null
				});
		}, 500)
	}

	p.preload = () => {
		img_1 = p.loadImage("./spread_1.png", () => { spreads["spread_1"].image_grid[0] = img_1 });
		img_2 = p.loadImage("./spread_2.png", () => { spreads["spread_2"].image_grid[0] = img_2 });
	}

	p.setup = () => {
		p.createCanvas(c_width, c_height);
		mic = new tone.UserMedia();
		meter = new tone.Meter();
		mic.connect(meter);
		mic.open();


		if (capturing) {
			//@ts-ignore
			capture = p.createCapture(p.VIDEO);
			capture.size(c_width, c_height);
			capture.hide();
			qr_code_init()
		}

	}

	p.draw = () => {
		let val = meter.getValue() + 30
		p.background(255);
		p.fill(255, 150, 0);
		p.ellipse(200, 200, 500, 500);
		p.textSize(32);

		if (val > 0) counter = (counter + (val / 100))

		// draw base image
		draw_base()

		let i = img
		if (current === "spread_1") i = img_1
		if (current === "spread_2") i = img_2

		// draw pixel grid
		// image_and_grid(i, 50, 50, 180, 290, counter)
		p.fill(0);
		p.text("Value: " + val, 10, 30);
		p.text("Counter: " + counter, 50, 50);

		// draw relevant information
		if (spreads[current]) {
			Object.entries(spreads[current]).forEach(([key, value]) => p[key](...value))
		}
	}

	p.keyPressed = (e) => {
		if (e.key === "c") {
			counter = 0
			console.log("Counter reset")
		}

	}

	//@ts-ignore
	p.image_grid = image_and_grid

}

new p5(sketch, document.getElementById('p5')!);


function map_value(value, oldMin, oldMax, newMin, newMax) {
	// Check if the old range is not zero to avoid division by zero
	if (oldMax - oldMin === 0) {
		throw new Error("The old range cannot have zero width.");
	}

	// Map the value to the new range
	var mappedValue = ((value - oldMin) * (newMax - newMin) / (oldMax - oldMin)) + newMin;

	// Clamp the mapped value within the new range
	if (newMin < newMax) {
		mappedValue = Math.min(Math.max(mappedValue, newMin), newMax);
	} else {
		mappedValue = Math.min(Math.max(mappedValue, newMax), newMin);
	}


	return mappedValue;
}


const to_type = [
	{ word: "a" },
	{ word: "hello" }
]


const audioContext = new AudioContext();
const time_since_last_word = 500

const get_file = async (path) => {
	const response = await fetch(path);

	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);
	return audioBuffer;
}

to_type.forEach(async (x) => {
	// @ts-ignore
	x.audio = await get_file(`./audio/${x.word}.mp3`)
})

const play_sample = (audioBuffer) => {
	const source = audioContext.createBufferSource();

	const gainNode = audioContext.createGain();
	gainNode.gain.value = .7;

	source.playbackRate.value = calculate_playback(time_since_last_word);
	source.buffer = audioBuffer;
	source.connect(gainNode);
	gainNode.connect(audioContext.destination);
	source.start();
}

function calculate_playback(milliseconds) {
	let playback_offset = map_value(milliseconds, 0, 3500, 0, .7)
	return 1.25 - playback_offset
}

function get_audio(word: string) {
	let found = to_type.find((x) => x.word.toLowerCase() === word);

	// @ts-ignore
	if (found) return found.audio
	else return undefined;
}

setTimeout(() => {
	let file = get_audio("hello")
	console.log(file)
	if (file) play_sample(file)

}, 2000)

let typed = sig("")

function check_last_word() {
	let len = typed().split(" ").length
	let last_word = typed().split(" ")[len - 1]
	let last_audio = get_audio(last_word.toLowerCase())

	if (last_audio) {
		play_sample(last_audio);
		// reset_last_word()
	}
	// updated()
}
