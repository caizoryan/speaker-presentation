import QrScanner from 'qr-scanner';
import p5 from 'p5';
import * as tone from "tone"

let capture;
let corners
let mic
let capturing = false

let canvas = document.getElementById('p5')
let c_width = canvas?.clientWidth
let c_height = canvas?.clientHeight

let img
let graphic

let spread_1 = {
	image: [img, 0, 0, 50, 70, 89, 330],
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
			if (corners) {
				p.fill(255, 0, 0)
				for (let i = 0; i < corners.length; i++) {
					p.ellipse(corners[i].x, corners[i].y, 10, 10)
				}
			}
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
		setInterval(() => {
			let canvas = document.querySelector('canvas');
			if (!canvas) return;
			QrScanner.scanImage(canvas, { returnDetailedScanResult: true })
				.then(result => {
					let text = result.data
					corners = result.cornerPoints
				})
				.catch(error => {
					corners = null
				});
		}, 500)
	}

	p.preload = () => {
		img = p.loadImage("./img.jpg", () => {
			spread_1.image[0] = img
		});
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

		// draw pixel grid
		image_and_grid(img, 50, 50, 180, 290, counter)
		p.fill(0);
		p.text("Value: " + val, 10, 30);
		p.text("Counter: " + counter, 50, 50);

		// draw relevant information
		// Object.entries(spread_1).forEach(([key, value]) => p[key](...value))
	}

	p.keyPressed = (e) => {
		if (e.key === "c") {
			counter = 0
			console.log("Counter reset")
		}

	}

}

new p5(sketch, document.getElementById('p5')!);




