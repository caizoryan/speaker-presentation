// x---------------------x
// -----------------------
// Imports
// -----------------------
// x---------------------x
//
import { eff_on, html, render, sig } from "./solid_monke/solid_monke"
import QrScanner from 'qr-scanner';
import p5 from 'p5';
import * as tone from "tone"

// x---------------------x
// -----------------------
// Model (Data) State
// -----------------------
// x---------------------x
//
let capture; // webcam capture
let mic; // microphone capture
let capturing = false
let xanh

// ---------------------
// DOM Element
// ---------------------
let canvas = document.getElementById('p5')
let c_width = canvas?.clientWidth
let c_height = canvas?.clientHeight


let image_layer

let current = "spread_12"

let time_since_last_word = 0
let typed = sig("")

let flash_timeout = 1500
let flash_counter = 0
let flash = null

let flash_bg = "yellow"
let flash_text = "blue"

let spreads = {
	spread_0: [
		["image_grid", "./images/0.png", 200, 200, 800, 800, () => counter],
		["image_grid", "./images/0_1.png", 50, 50, 480, 290, () => counter],
		["image_grid", "./images/0_2.png", 1300, 500, 480, 290, () => counter]
	],
	spread_1: [
		["textSize", 50],
		["text", "SPREAD 1", 50, 50],
		["image_grid", "./images/1.png", 50, 50, 1200, 500, () => counter],
	],

	spread_2: [
		["textSize", 50],
		["text", "SPREAD 2", 50, 50],
		["image_grid", "./images/2.png", 1250, 550, 300, 300, () => counter],
		["image_grid", "./images/2_1.png", 150, 150, 1200, 600, () => counter - 50],

	],

	spread_3: [
		["textSize", 50],
		["text", "SPREAD 3", 50, 50],
		["image_grid", "./images/3.png", 450, 150, 800, 800, () => counter],

	],

	spread_4: [
		["textSize", 50],
		["text", "SPREAD 4", 50, 50],
		["image_grid", "./images/spinner.gif", 50, 50, 1200, 500, () => counter - 300],
	],

	spread_5: [
		["textSize", 50],
		["text", "SPREAD 5", 50, 50],
		["image_grid", "./images/5.png", 250, 150, 1400, 800, () => counter],
	],

	spread_6: [
		["textSize", 50],
		["text", "SPREAD 6", 50, 50],
		["image_grid", "./images/6.png", 250, 150, 1200, 500, () => counter],
	],

	spread_7: [
		["textSize", 50],
		["text", "SPREAD 7", 50, 50],
		["image_grid", "./images/7.png", 250, 150, 1200, 500, () => counter],
	],

	spread_8: [
		["textSize", 50],
		["text", "SPREAD 8", 50, 50],
		["image_grid", "./images/8.jpg", 250, 150, 500, 800, () => counter],
	],

	spread_9: [
		["textSize", 50],
		["text", "SPREAD 9", 50, 50],
		["image_grid", "./images/9_1.png", 50, 150, 800, 800, () => counter - 300],
		["image_grid", "./images/9_2.png", 850, 150, 800, 800, () => counter],
	],

	spread_11: [
		["textSize", 50],
		["text", "SPREAD 11", 50, 50],
		["image_grid", "./images/11.png", 50, 150, 800, 800, () => counter > 200 ? 0 : counter],
		["image_grid", "./images/11_1.png", 850, 150, 800, 800, () => counter - 100],
		["image_grid", "./images/11_2.png", 50, 150, 800, 800, () => counter - 150],
	],

	spread_12: [
		["textSize", 50],
		["text", "SPREAD 12", 50, 50],
		["image_grid", "./images/12.png", 50, 150, 250, 250, () => counter],
		["image_grid", "./images/12_1.png", 1350, 150, 550, 550, () => counter - 100],
		["image_grid", "./images/12_2.png", 50, 150, 800, 800, () => counter - 150],
		["image_grid", "./images/12_3.png", 1250, 750, 100, 100, () => counter - 200],
		["image_grid", "./images/12_4.png", 750, 150, 800, 800, () => counter - 250],
	],

	spread_13: [

	]

}


let grid_compare = Array.from({ length: 500 }, () => Array.from({ length: 500 }, () => Math.random()))
// let counter = 0
let counter = 500
let meter

let sketch = (p5: p5) => {
	function draw_video() {
		if (capturing) {
			p5.image(capture, 0, 0, c_width, c_height);
		}
	}

	function draw_pixel_grid(p, x: number, y: number, w: number, h: number, skip: number) {
		let size = 10
		let row = w / size
		let col = h / size

		let positive = "black"
		let negative = "white"
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

	function image_grid(img, x, y, w, h, skip) {
		if ("function" === typeof skip) skip = skip()
		if (!image_layer) image_layer = p5.createGraphics(p5.width, p5.height)

		image_layer.image(img, x, y, w, h)
		image_layer.blendMode(p5.MULTIPLY)
		image_layer.blendMode(p5.SCREEN)
		draw_pixel_grid(image_layer, x, y, w, h, skip)
		image_layer.blendMode(p5.BLEND)

		p5.blendMode(p5.SCREEN)
		p5.blendMode(p5.MULTIPLY)
		p5.image(image_layer, 0, 0)
		p5.blendMode(p5.BLEND)
	}

	function qr_code_init() {
		let options = Object.keys(spreads)
		setInterval(() => {
			let canvas = document.querySelector('canvas');
			if (!canvas) return;
			QrScanner.scanImage(canvas, { returnDetailedScanResult: true })
				.then(result => {
					let text = result.data

					if (text !== current) {
						if (options.includes(text)) {
							counter = 0
							current = text
						}
					}

				})
				.catch(error => {
				});
		}, 500)
	}


	p5.preload = () => {
		xanh = p5.loadFont("./xanh.ttf")
		// p5.textFont(font)
		Object.values(spreads).forEach((spread) => {
			spread.forEach((fn) => {
				if ("string" === typeof fn[0]
					&& fn[0].includes("image")
					&& "string" === typeof fn[1]) {
					// @ts-ignore
					let img = p5.loadImage(fn[1], () => { fn[1] = img })
				}
			})
		})
	}

	p5.setup = () => {
		p5.createCanvas(c_width, c_height);
		mic = new tone.UserMedia();
		meter = new tone.Meter();
		mic.connect(meter);
		mic.open();

		p5.textFont("monospace")


		if (capturing) {
			//@ts-ignore
			capture = p5.createCapture(p5.VIDEO);
			capture.size(c_width, c_height);
			capture.hide();
			qr_code_init()
		}

	}

	p5.draw = () => {
		let val = meter.getValue() + 30
		let delta = p5.deltaTime
		time_since_last_word += delta
		p5.background(255);
		p5.fill(255, 150, 0);
		// p5.ellipse(200, 200, 500, 500);
		p5.textSize(12);

		if (val > 0) counter = (counter + (val / 15))

		// draw base image
		draw_video()

		// draw pixel grid
		p5.fill(0);
		p5.text("Value: " + val, 10, 30);
		p5.text("Counter: " + counter, 10, 50);

		// draw relevant information
		if (spreads[current]) {
			spreads[current].forEach((x) => p5[x[0]](...x.slice(1)))
			// Object.entries(spreads[current]).forEach(([key, value]) => p[key](...value))
		}

		if ("string" == typeof flash) {
			if (flash_counter < flash_timeout) {
				p5.fill(flash_bg)
				p5.rect(0, 0, p5.width, p5.height)
				p5.fill(flash_text)
				p5.textSize(80)
				p5.textAlign(p5.CENTER, p5.CENTER)
				p5.text(flash, p5.width / 2, p5.height / 2)
				p5.textAlign(p5.LEFT, p5.TOP)
				flash_counter += delta
			}
			else {
				flash_counter = 0
				flash = null
			}
		}
	}

	p5.keyPressed = (e) => {
		// if e target is an input do not run
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
		if (e.key === "c") {
			flash = "COGNITION (<->) COGNITIVE"
			flash_bg = "yellow"
			flash_text = "blue"
		}

		if (e.key === "f") {
			setTimeout(() => {

				document.querySelector("input").focus()
			}, 5)
		}

		if (e.key === "a") {
			flash = "AXIOM"
			flash_bg = "cyan"
			flash_text = "yellow"
		}

		if (e.key === "q") {
			flash = "QUESTION"
			flash_bg = "blue"
			flash_text = "cyan"
		}

		if (e.key === "i") {
			flash = "IMPLICATION"
			flash_bg = "white"
			flash_text = "black"
		}

	}

	//@ts-ignore
	p5.image_grid = image_grid

}

new p5(sketch, document.getElementById('p5')!);


// x---------------------x
// -----------------------
// AUDIO ENGINE
// -----------------------
// x---------------------x
//

const audioContext = new AudioContext();

// -----------------------
// AUDIO Library
// -----------------------
const to_type = [
	{ word: "hello" },
	{ word: "if" },
	{ word: "we" },
	{ word: "consider" },
	{ word: "but" },
	{ word: "if" },
	{ word: "mind" },
	{ word: "with" },
	{ word: "linked" },
	{ word: "necessarily" },
	{ word: "not" },
	{ word: "then" },
	{ word: "axiom" },
	{ word: "an" },
	{ word: "as" },
	{ word: "world" },
	{ word: "move" },
	{ word: "how" },
	{ word: "us" },
	{ word: "unbeknownst" },
	{ word: "this" },
	{ word: "teach" },
	{ word: "recieve" },
	{ word: "what" },
	{ word: "and" },
	{ word: "in" },
	{ word: "is" },
	{ word: "understand" },
	{ word: "push" },
	{ word: "they" },
	{ word: "environment" },
	{ word: "external" },
	{ word: "our" },
	{ word: "noise" },
	{ word: "below" },
	{ word: "right" },
	{ word: "present" },
	{ word: "still" },
	{ word: "untrained" },
	{ word: "numb" },
	{ word: "mutates" },
	{ word: "becomes" },
	{ word: "sense" },
	{ word: "the" },
	{ word: "of" },
	{ word: "perceptors" },
	{ word: "to" },
	{ word: "ranges" },

	{ word: "above" },
	{ word: "consider" },
	{ word: "we" },
	{ word: "body" },
	{ word: "bring" },
	{ word: "them" },
	{ word: "chasm" },
	{ word: "close" },
	{ word: "work" },
	{ word: "mind" },
	{ word: "alien" },
	{ word: "brain" },
	{ word: "between" },
	{ word: "shift" },
	{ word: "we" },
	{ word: "itself" },
	{ word: "through" },
	{ word: "acting" },
	{ word: "by" },
	{ word: "represent" },
	{ word: "thus" },
	{ word: "can" },

	{ word: "function" },
	{ word: "motor" },
	{ word: "its" },
	{ word: "sensory" },
	{ word: "it" },
	{ word: "reframes" },
	{ word: "interprets" },
	{ word: "also" },
	{ word: "but" },
	{ word: "embodies" },
	{ word: "only" },
	{ word: "not" },
	{ word: "explicit" },
	{ word: "read" },
	{ word: "unfolded" },
	{ word: "be" },
	{ word: "medium" },
	{ word: "becomes" },
	{ word: "knowledges" },
	{ word: "these" },
	{ word: "slices" },
	{ word: "revealing" },
	{ word: "unfolding" },
	{ word: "deconstructing" },
	{ word: "understand" },
	{ word: "tools" },
	{ word: "as" },
	{ word: "understanding" },
	{ word: "use" },
	{ word: "processes" },
	{ word: "tactile" },
	{ word: "dissemination" },
	{ word: "knowledge" },


	{ word: "k_1" },
	{ word: "k_2" },
	{ word: "k_3" },
	{ word: "k_4" },
	{ word: "k_5" },
	{ word: "k_6" },
	{ word: "k_7" },
]


// -----------------------
// Utility Functions
// -----------------------
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


async function get_file(path) {
	const response = await fetch(path);

	const arrayBuffer = await response.arrayBuffer();
	const audioBuffer = await new AudioContext().decodeAudioData(arrayBuffer);
	return audioBuffer;
}

function reset_last_word() { time_since_last_word = 0 }

function play_keyboard() {
	let random = Math.floor(Math.random() * 7)
	let audioBuffer = get_audio("k_" + random)

	const source = audioContext.createBufferSource();
	const gainNode = audioContext.createGain();
	gainNode.gain.value = .4;

	source.playbackRate.value = 1;
	source.buffer = audioBuffer;
	source.connect(gainNode);
	gainNode.connect(audioContext.destination);
	source.start();
}

function play_sample(audioBuffer) {
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
	let playback_offset = map_value(milliseconds, 0, 3500, 0, .3)
	return 1.15 - playback_offset
}

function get_audio(word: string) {
	let found = to_type.find((x) => x.word.toLowerCase() === word);

	// @ts-ignore
	if (found) return found.audio
	else return undefined;
}

function check_last_word() {
	let len = typed().split(" ").length
	let last_word = typed().split(" ")[len - 1]
	let last_audio = get_audio(last_word.toLowerCase())

	if (last_word === "cognition") {
		flash = "COGNITION (<->) COGNITIVE"
		flash_bg = "yellow"
		flash_text = "blue"
		return
	}

	if (last_word === "environment") {
		type_in("They push to understand the noise the body is present in, and what they receive, they teach the body and this, unbeknownst to us, is how we move in the world.", 150)
	}

	if (last_audio) {
		play_sample(last_audio);
		reset_last_word()
	}
}


// -----------------------
// Hooks
// -----------------------
eff_on(typed, () => {
	check_last_word();
	// make sound

})



to_type.forEach(async (x) => {
	// @ts-ignore
	x.audio = await get_file(`./audio/${x.word}.mp3`)
})


// -----------------------
// DOM Elements
// -----------------------
let input = () => {
	return html`
		textarea [value=${typed} oninput=${(e) => typed.set(e.target.value)} onkeydown=${play_keyboard}]`
}

function type_in(sentence, speed = 150) {
	let keys = sentence.split("")

	keys.forEach((key, i) => {
		setTimeout(() => {
			typed.set(typed() + key)
			play_keyboard()
		}, i * speed)
	})
}

// setTimeout(() => {
// 	type_in("hello k_1 world k_3 this is automatic typing")
// }, 3000)


render(input, document.querySelector(".controller"))
