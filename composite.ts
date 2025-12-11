import sharp from "sharp";

type underImages = {
	path: string;
	left: number;
	top: number;
	width?: number;
	height?: number;
};
type compositeUnderMain = {
	mainPath: string; // path to main image (with transparent windows)
	underImages: underImages[]; // array [{ path: 'img1.webp', left: 100, top: 200, width?, height? }, ...]
	outputPath: string;
	resizeMainTo?: {
		width: number;
		height: number;
	}; // optional { width, height } to resize main and base canvas
};
async function compositeUnderMain({
	mainPath,
	underImages,
	outputPath = "out.webp",
	resizeMainTo,
}: compositeUnderMain) {
	// load main and metadata
	const mainSharp = sharp(mainPath).ensureAlpha();
	const mainMeta = await mainSharp.metadata();
	const width = resizeMainTo?.width ?? mainMeta.width!;
	const height = resizeMainTo?.height ?? mainMeta.height!;

	// prepare under images in parallel and normalize them to buffers
	const composites = await Promise.all(
		underImages.map(async (img) => {
			const buf =
				img.width || img.height
					? await sharp(img.path)
							.resize(img.width, img.height, { fit: "contain" })
							.toBuffer()
					: await sharp(img.path).toBuffer();
			return { input: buf, left: img.left ?? 0, top: img.top ?? 0 };
		})
	);

	const mainBuffer =
		resizeMainTo || mainMeta.width !== width || mainMeta.height !== height
			? await mainSharp.resize(width, height).toBuffer()
			: await mainSharp.toBuffer();

	// single composite call: under images first, then main on top
	const canvas = sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	});

	const textSvg = Buffer.from(`
		<svg width="800" height="200">
			<defs>
				<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="2" dy="2" stdDeviation="4" flood-color="black" flood-opacity="0.7"/>
				</filter>
			</defs>
			<text x="100" y="150"
			font-size="30"
			font-family="Arial"
			fill="white"
			filter="url(#shadow)">
			www.digitalniweb.cz
			</text>
		</svg>
		`);

	await canvas
		.composite([
			...composites,
			{ input: mainBuffer, left: 0, top: 0 },
			{
				input: textSvg,
				top: 50,
				left: 50,
			},
		])
		.webp()
		.toFile(outputPath);

	return { width, height, outputPath };
}

// test run
try {
	await compositeUnderMain({
		mainPath: "composites/carousel-template.webp",
		underImages: [
			{
				path: "screenshots/digitalniweb.webp",
				left: 600,
				top: 280,
			},
			{
				path: "screenshots/digitalniweb-tablet.webp",
				left: 1290,
				top: 615,
			},
			{
				path: "screenshots/digitalniweb-mobile.webp",
				left: 440,
				top: 590,
			},
		],
		outputPath: "composites/test.webp",
		// resizeMainTo: { width: 1920, height: 1080 }, // optional
	});
	console.log("Done — composited.webp created");
} catch (err) {
	console.error("Error:", err);
}
