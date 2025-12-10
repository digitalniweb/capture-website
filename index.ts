import captureWebsite from "capture-website";
import sharp from "sharp";

import type { Options } from "capture-website";
type myOptions = Options & { finalWidth?: number; width: number };

let url = "https://www.digitalniweb.cz";
let name = "digitalniweb";

let outputDir = "screenshots/";

let type = "webp" as Options["type"];

let mainOptions: Options = {
	quality: 0.7,
	type,
};

let preloadLazyContent = false;
let styles = [`.animate-box{opacity: 1 !important;}`];

let desktopOptions: myOptions = {
	width: 1920, // website width while capture
	scaleFactor: 1,
	preloadLazyContent,
	styles,
	clip: {
		x: 0,
		y: 0,
		width: 1920,
		height: 1080,
	},
	finalWidth: 700, // final width of image
};

let tabletOptions: myOptions = {
	width: 1280,
	scaleFactor: 1,
	preloadLazyContent,
	styles,
	clip: {
		x: 0,
		y: 0,
		width: 1280,
		height: 800,
	},
	finalWidth: 360,
};

let mobileOptions: myOptions = {
	width: 360,
	scaleFactor: 1,
	preloadLazyContent,
	styles,
	clip: {
		x: 0,
		y: 0,
		width: 360,
		height: 800,
	},
	finalWidth: 150,
};

let devices = [
	{
		options: { ...mainOptions, ...desktopOptions },
		postfix: "",
	},
	{
		options: { ...mainOptions, ...tabletOptions },
		postfix: "-tablet",
	},
	{
		options: { ...mainOptions, ...mobileOptions },
		postfix: "-mobile",
	},
];

for (const device of devices) {
	let buffer = await captureWebsite.buffer(url, device.options);

	if (
		device.options.finalWidth &&
		device.options.finalWidth != device.options.width
	) {
		buffer = await sharp(buffer)
			.resize(Math.round(device.options.finalWidth))
			.toFormat("webp", { quality: 100 })
			.toBuffer();
	}

	await sharp(buffer).toFile(`${outputDir}${name}${device.postfix}.${type}`);
}
