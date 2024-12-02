import QrScanner from 'qr-scanner';
import p5 from 'p5';
let capture;
let corners
let capturing = false

let img
let spread_1 = {
	image: [img, 0, 0, 50, 70, 89, 330],
}
let grid_compare = Array.from({ length: 500 }, () => Array.from({ length: 500 }, () => Math.random()))


let counter = 0
setInterval(() => {
	counter++
}, 500)

let sketch = (p: p5) => {
	function draw_base() {
		if (capturing) {
			p.image(capture, 0, 0, 720, 400);
			if (corners) {
				p.fill(255, 0, 0)
				for (let i = 0; i < corners.length; i++) {
					p.ellipse(corners[i].x, corners[i].y, 10, 10)
				}
			}
		}
	}

	function draw_pixel_grid(x: number, y: number, w: number, h: number, skip: number) {
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
		p.createCanvas(720, 400);

		if (capturing) {
			//@ts-ignore
			capture = p.createCapture(p.VIDEO);
			capture.size(720, 400);
			capture.hide();
			qr_code_init()
		}

	}


	p.draw = () => {
		p.background(255);
		// draw base image
		draw_base()

		// draw pixel grid
		p.image(img, 0, 0, 200, 200)
		p.blendMode(p.MULTIPLY)
		draw_pixel_grid(0, 0, 200, 200, counter)
		p.blendMode(p.NORMAL)

		// draw relevant information
		// Object.entries(spread_1).forEach(([key, value]) => p[key](...value))
	}

}

new p5(sketch, document.getElementById('canvas')!);




