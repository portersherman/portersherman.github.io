const COLOR = "#000";
const COLOR_SECONDARY = "#3780B8";
const COLOR_TERTIARY = "#36b6a6";

const LIGHT_BACKGROUND = "#FFF";
const DARK_BACKGROUND = "#000";

const LEFT_BOUND = 62;
const GUTTER = 50;
const ROWS = 16;
const COLS = 30;
const X_SPREAD = 2;
const Y_SPREAD = 2;
const MAX_TTL = 500;
const RAMP_TIME = 50;

const CUTOUT_X_WIDTH = 6;
const CUTOUT_Y_HEIGHT = 3;

const LIGHT = "light";
const DARK = "dark";

const GLOBAL_RAMP_TIME = 25;

let dests = [];
let links = [];
let globalColor;
let globalColorSecondary;
let height;
let width;
let xStep;
let yStep;
let backgroundColor;
let themeSwitcher;
let canvas;
let logoLight, logoDark;
let globalRamp = 0;

let theme = LIGHT;

function setThemeSwitcherProps(target, toTheme) {
	target.style.borderColor = (toTheme === LIGHT) ? DARK_BACKGROUND : LIGHT_BACKGROUND;
	target.firstElementChild.style.backgroundColor = (toTheme === LIGHT) ? DARK_BACKGROUND : LIGHT_BACKGROUND;

	backgroundColor = (toTheme === LIGHT) ? color(LIGHT_BACKGROUND) : color(DARK_BACKGROUND);
	theme = (toTheme === LIGHT) ? LIGHT : DARK;

	document.cookie = JSON.stringify({"theme": theme});

	logoLight.style.zIndex = (toTheme === LIGHT) ? 2 : 3;
	logoDark.style.zIndex = (toTheme === LIGHT) ? 3 : 2;
}

function windowResized() {
	width = windowWidth;
	height = windowHeight;
	canvas = resizeCanvas(width, height);

	xStep = ((width - GUTTER) - LEFT_BOUND) / (COLS - 1);
	yStep = ((height - GUTTER * 2) / (ROWS - 1));

	for (let i = 0; i < ROWS; i++) {
		for (let j = 0; j < COLS; j++) {
			if (dests[i][j] !== null) {
				dests[i][j].xPos = (width - GUTTER) - xStep * j
				dests[i][j].yPos = GUTTER + yStep * i;
			}
		}
	}
}

function setup() {
	frameRate(30);

	width = windowWidth;
	height = windowHeight;
	canvas = createCanvas(width, height);
	canvas.style("z-index", "-1");
	themeSwitcher = document.getElementsByClassName("themeSwitcher")[0];
	logoDark = document.getElementsByClassName("logoDark")[0];
	logoLight = document.getElementsByClassName("logoLight")[0];
	setThemeSwitcherProps(themeSwitcher, (document.cookie ? JSON.parse(document.cookie).theme : false) === LIGHT ? LIGHT : DARK);

	themeSwitcher.addEventListener("click", (e) => {
		setThemeSwitcherProps(e.target, theme === LIGHT ? DARK : LIGHT);
	});

	globalColor = color(COLOR);
	globalColorSecondary = color(COLOR_SECONDARY);
	globalColorTertiary = color(COLOR_TERTIARY);

	xStep = ((width - GUTTER) - LEFT_BOUND) / (COLS - 1);
	yStep = ((height - GUTTER * 2) / (ROWS - 1));
	for (let i = 0; i < ROWS; i++) {
		dests.push([]);
		for (let j = 0; j < COLS; j++) {
			if (((i === ROWS - 1 && j === 0) || (i === 0 && j === 0))
				|| (j >= COLS / 2 - CUTOUT_X_WIDTH && j < COLS / 2 + CUTOUT_X_WIDTH
					&& i >= ROWS / 2 - CUTOUT_Y_HEIGHT && i < ROWS / 2 + CUTOUT_Y_HEIGHT)){
				dests[i][j] = null;
			} else {
				dests[i][j] = new Dest((width - GUTTER) - xStep * j, GUTTER + yStep * i, 4);
			}
		}
	}
}

class Dest {
	constructor(xPos, yPos, radius) {
		this.xPos = xPos;
		this.yPos = yPos;
		this.radius = radius;
		this.opacity = 255;
		this.color = lerpColor(globalColorSecondary, globalColorTertiary, Math.random());
	}

	draw() {
		let fillColor = this.color;
		fillColor.setAlpha(this.opacity * (globalRamp / GLOBAL_RAMP_TIME));
		fill(fillColor);
		noStroke();
		ellipseMode(CENTER);
		ellipse(this.xPos, this.yPos, this.radius);
	}

	print() {
		return "x: " + this.xPos + " y: " + this.yPos + " r: " + this.radius;
	}
}

class Link {
	constructor(src, dest) {
		this.src = src;
		this.dest = dest;
		this.opacity = Math.min(src.opacity, dest.opacity);
		this.color = lerpColor(globalColorSecondary, globalColorTertiary, Math.random());
		this.ttl = MAX_TTL;
		this.ramp = 0;
	}

	draw() {
		this.color.setAlpha(this.opacity * (this.ramp / RAMP_TIME) * (this.ttl / MAX_TTL) * (globalRamp / GLOBAL_RAMP_TIME));
		stroke(this.color);
		strokeWeight(1);
		line(
			this.src.xPos, 
			this.src.yPos,
			this.src.xPos + (this.dest.xPos - this.src.xPos) * (this.ramp / RAMP_TIME), 
			this.src.yPos + (this.dest.yPos - this.src.yPos) * (this.ramp / RAMP_TIME)
		);
		this.ttl -= 1;
		if (this.ramp < RAMP_TIME) {
			this.ramp += 1;
		}
		if (this.ttl === 0) {
			return false;
		}
		return true;
	}
}

function createLink() {
	let randIndex = Math.floor(Math.random() * ROWS * COLS);
	let src = dests[Math.floor(randIndex / COLS)][randIndex % COLS];
	let xDist = Math.round((Math.random() - 0.5) * X_SPREAD);
	let yDist = Math.round((Math.random() - 0.5) * Y_SPREAD);
	let dest = dests[clamp(Math.floor(randIndex / COLS) + yDist, 0, ROWS - 1)][clamp(randIndex % COLS + xDist, 0, COLS - 1)];
	
	if (src === dest || src === null || dest === null) {
		return;
	}

	links.push(new Link(src, dest))
}

function clamp(x, min, max) {
	return (x < min) ? min : (x > max) ? max : x;
}

function keyTyped() {
	if (key === 's') {
		saveCanvas("soundcloud_cover", "png");
	}
}

function renderClock() {
	const now = new Date();
	const hours = now.getHours();
	const minutes = now.getMinutes();
	const seconds = now.getSeconds();

	let xStart = (windowWidth / 2) - xStep * CUTOUT_X_WIDTH + GUTTER;
	let hourYStart = (windowHeight / 2) - yStep * CUTOUT_Y_HEIGHT + GUTTER;
	let minuteYStart = (windowHeight / 2);
	let secondYStart = (windowHeight / 2) + yStep * CUTOUT_Y_HEIGHT - GUTTER;

	let hourLength = (xStep * CUTOUT_X_WIDTH * 2 - GUTTER * 2) * hours / 24;
	let minuteLength = (xStep * CUTOUT_X_WIDTH * 2 - GUTTER * 2) * minutes / 60;
	let secondLength = (xStep * CUTOUT_X_WIDTH * 2 - GUTTER * 2) * seconds / 60;

	let hourColor = globalColorSecondary;
	let minuteColor = lerpColor(globalColorSecondary, globalColorTertiary, 0.5);
	let secondColor = globalColorTertiary;

	hourColor.setAlpha(255 * (globalRamp / GLOBAL_RAMP_TIME));
	minuteColor.setAlpha(255 * (globalRamp / GLOBAL_RAMP_TIME));
	secondColor.setAlpha(255 * (globalRamp / GLOBAL_RAMP_TIME));

	strokeCap(SQUARE);

	stroke(hourColor);
	strokeWeight(10);
	line(xStart, hourYStart, xStart + hourLength, hourYStart);

	stroke(minuteColor);
	strokeWeight(7.5);
	line(xStart, minuteYStart, xStart + minuteLength, minuteYStart);

	stroke(secondColor);
	strokeWeight(5);
	line(xStart, secondYStart, xStart + secondLength, secondYStart);

	noStroke();
	fill(hourColor);
	text(hours, xStart, hourYStart - 12);

	fill(minuteColor);
	text(minutes, xStart, minuteYStart - 12);

	fill(secondColor);
	text(seconds, xStart, secondYStart - 12);
}

function draw() {
	if (globalRamp < GLOBAL_RAMP_TIME) {
		globalRamp += 1;
	}

	clear();

	backgroundColor.setAlpha(255 * globalRamp / GLOBAL_RAMP_TIME);
	background(backgroundColor);

	createLink();

	links.forEach((l, index) => {
		if (!l.draw()) {
			links.splice(index, 1);
		}
	});

	dests.forEach(row => {
		row.forEach(dest => {
			if (dest != null) {
				dest.draw();
			}
		});
	});

	renderClock();
}