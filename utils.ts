import { exec, spawn } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import youtubesearchapi from 'youtube-search-api';
import ytdl from '@distube/ytdl-core';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = os.platform() === 'win32';

const ytdlpPath = isWindows
	? path.join(__dirname, 'bin', 'win', 'yt-dlp.exe')
	: path.join(__dirname, 'bin', 'linux', 'yt-dlp');

export type RawSearchItem = {
	id: string;
	title?: string;
	thumbnail?: { thumbnails?: { url?: string }[] };
	length?: { simpleText?: string } | string;
	type?: string;
};

const getDataSearch = async (query: string, maxResults: number) => {
	const resp = await youtubesearchapi.GetListByKeyword(
		query,
		false,
		maxResults,
		[{ type: 'video' }]
	);

	const videos = resp.items.filter((item) => item.type === 'video');

	return { items: videos as RawSearchItem[] };
};

export type SearchResult = {
	videoUrl: string;
	videoId: string;
	title: string;
	imgVideo: string;
	duration: string;
};

const parseSearchData = (arrayfromSearch: RawSearchItem[]): SearchResult[] => {
	// console.dir(arrayfromSearch, { depth: null });
	return arrayfromSearch.map((d) => {
		let {
			id = 'no-id',
			title = 'Sin título',
			thumbnail: { thumbnails = [{ url: '' }] } = {},
		} = d;

		const duration =
			typeof d.length === 'string'
				? d.length
				: d.length?.simpleText ?? 'Sin duración';

		return {
			videoUrl: `https://www.youtube.com/watch?v=${id}`,
			videoId: id,
			title,
			imgVideo: thumbnails[0].url || '',
			duration,
		};
	});
};

type FormatItem = {
	duration: string;
	title: string;
};

const messageCustomFormat = (items: FormatItem[]) => {
	return items.reduce((suma, act, i) => {
		return `${suma == '' ? '' : suma + '\n\n'}${
			'```option'.padEnd(12) + '``` : ' + (i + 1)
		}\n${'```duration'.padEnd(12) + '``` : ' + act.duration}\n${
			'```title'.padEnd(12) + '``` : ' + act.title
		}`;
	}, '');
};

// const convertMP3 = (pathVideo, pathOutput) => {
// 	return new Promise((resolve) => {
// 		let outputFilePath = `${pathOutput}.mp3`;
// 		// Comando FFmpeg para convertir el archivo
// 		const ffmpegCommand = `ffmpeg -y -i ${pathVideo} ${outputFilePath}`;

// 		const ffmpegProcess = exec(ffmpegCommand);

// 		ffmpegProcess.on('exit', (code) => {
// 			if (code === 0) {
// 				// console.log('La conversión se completó exitosamente.');
// 				resolve(outputFilePath);
// 			} else {
// 				console.error('La conversión falló con el código de salida:', code);
// 			}
// 		});

// 		// Capturar el evento close cuando el proceso se cierra
// 		// ffmpegProcess.on('close', () => {
// 		//     console.log('El proceso FFmpeg se ha cerrado.');
// 		// });
// 	});
// };

//obtener las opciones de option ,qualyti y calidad si no los consigue se usan los default

let options = ['1', '2', '3', '4', '5'];
let formats = ['mp4', 'mp3'];
let qualitys = ['highest', 'medium', 'lowest'];

const optionSentence = (
	array: string[],
	sentenceD: string,
	dataDefault: string
) => {
	let ff = sentenceD
		.toLowerCase()
		.split(' ')
		.filter((el) => el !== '');
	let ll = ff.find((e) => array.some((gg) => e == gg));
	if (!ll) return dataDefault;
	return ll;
};

const parseStringValues = (sentence: string) => {
	let option = optionSentence(options, sentence, 'no');
	let format = optionSentence(formats, sentence, 'no');
	let quality = optionSentence(qualitys, sentence, 'no');
	return { option, format, quality };
};

const evalu = (option: string, format: string, quality: string) => {
	// let hasData = 'yes'
	let noData = 'no';
	if (option == noData) {
		return 'noDataOption';
	}
	if (option !== noData && format == noData && quality == noData) {
		return { mode: 1, dataOptions: { option } };
	}

	return {
		mode: 2,
		dataOptions: {
			option: option == 'no' ? '1' : option,
			format: format == 'no' ? 'mp3' : format,
			quality: quality == 'no' ? 'lowest' : quality,
		},
	};
};

const parseStringValues2 = (sentence: string, qualitysN: string[]) => {
	let format = optionSentence(formats, sentence, 'no');
	let numOptionQuality = optionSentence(qualitysN, sentence, 'no');
	return { format, numOptionQuality };
};

const evalu2 = (format: string, numOptionQuality: string) => {
	return {
		format: format == 'no' ? 'mp4' : format,
		numOptionQuality: numOptionQuality == 'no' ? '1' : numOptionQuality,
	};
};

let dataInfoMesague = (array) => {
	let datamesague = array.reduce((ant, format, i) => {
		return `${ant} ${i + 1} : ${format.resolution} ${format.ext} \n`;
	}, '');

	return datamesague;
};

// const downloadG = async (url, index, name) => {
// 	const videoURL = url;

// 	let outputFilePath = `${name}.mp4`;
// 	return new Promise(async (resolve) => {
// 		const info = await ytdl.getInfo(videoURL);
// 		// console.log('dataformat', index);
// 		const options = {
// 			format: info.formats[index],
// 		};
// 		ytdl(videoURL, options)
// 			.pipe(fs.createWriteStream(outputFilePath))
// 			.on('finish', () => {
// 				// console.log('Video descargado correctamente.');
// 				resolve(outputFilePath);
// 			})
// 			.on('error', (error) => {
// 				console.error('Error al descargar el video:', error);
// 			});
// 	});
// };

const downloadVideo = async ({
	url,
	resolution = null,
	audioOnly = false,
	allowLowerQuality = false,
	onProgress = null,
	onWarning = null,
}) => {
	const yt_dlp_path = ytdlpPath;
	const randomName = generateRandomName();
	const outputTemplate = `%(title).80s__${randomName}.%(ext)s`;
	const finalExtension = audioOnly ? 'mp3' : 'mp4';

	const baseArgs = audioOnly
		? ['--extract-audio', '--audio-format', 'mp3']
		: ['--merge-output-format', 'mp4'];

	const resolutionSelector = allowLowerQuality
		? `height<=${resolution}`
		: `height=${resolution}`;

	const formatSelector = audioOnly
		? 'ba[ext=m4a]/bestaudio'
		: `bv*[ext=mp4][${resolutionSelector}]+ba[ext=m4a]/mp4`;

	const progress = [
		'--newline',
		'--progress',
		'--progress-delta',
		'3',
		'--progress-template',
		// 'download:%(progress.downloaded_bytes)s|%(progress.total_bytes)s',
		// '%(progress._default_template)s',
		// 'download:[%(ext)s]%(progress.downloaded_bytes)s|%(progress.total_bytes)s',
		// 'download:%(filename)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s',
		'download:%(info.ext)s|%(progress.downloaded_bytes)s|%(progress.total_bytes)s',
	];

	// Armar array de argumentos completo
	const args = [
		'--no-playlist',
		'-f',
		formatSelector,
		'-o',
		outputTemplate,
		...baseArgs,
		...progress,
		url,
	];

	console.log('⏬ Ejecutando comando:', args.join(' '));

	return new Promise((resolve, reject) => {
		const dwn = spawn(yt_dlp_path, args);

		dwn.stdout.on('data', (data) => {
			const line = data.toString().trim();

			// console.log(line);

			const lines = data.toString().trim().split('\n');
			for (const line of lines) {
				const m1 = line.match(/^(\w+)\|(\d+)\|(\d+)$/);

				console.log({ m1 });
				if (!m1) continue;

				const [, fileOrExt, downloadedStr, totalStr] = m1;
				let currentType;
				let downloaded = Number(downloadedStr);
				let total = Number(totalStr);

				currentType = fileOrExt === 'mp4' ? 'video' : 'audio';

				const percent = ((downloaded / total) * 100).toFixed(1);

				if (onProgress) {
					console.log('se ejecuta onProgress');
					console.log(Number(percent));
					onProgress({
						type: currentType,
						downloaded,
						total,
						percent: Number(percent),
					});
				}
			}
		});

		let errorOutput = '';
		dwn.stderr.on('data', async (data) => {
			if (data) {
				errorOutput += data.toString();
				// return reject(data);
			}
		});

		dwn.on('close', (code) => {
			if (code === 0) {
				console.log('✅ Descarga completada.');
				const finalPath = findGeneratedFile(randomName, finalExtension);

				if (!finalPath) {
					return reject(
						new Error('❌ Archivo no encontrado después de la descarga')
					);
				}

				console.log(`✅ Archivo guardado como: ${finalPath}`);
				resolve(finalPath);
			} else {
				reject(new Error(errorOutput.trim()));
			}
		});
	});
};

function findGeneratedFile(randomName, ext) {
	const files = fs.readdirSync(process.cwd());
	const match = files.find(
		(file) =>
			file.includes(randomName) && file.toLowerCase().endsWith(`.${ext}`)
	);
	return match ? path.resolve(match) : null;
}

function sanitizeFilename(name) {
	return name.replace(/[\\/:*?"<>|]/g, '').trim();
}

const joinVideoAndAudio = (videoPath, audioPath, ouputName) => {
	return new Promise((resolve) => {
		let outputFilePath = `${ouputName}.mp4`;
		const ffmpegCommand = `ffmpeg -y -i ${videoPath} -i ${audioPath} -c:v copy -c:a copy ${outputFilePath}`;
		// console.log(ffmpegCommand)
		const ffmpegProcess = exec(ffmpegCommand);

		ffmpegProcess.on('exit', (code) => {
			if (code === 0) {
				// console.log('La Union se completó exitosamente.');
				resolve(outputFilePath);
			} else {
				console.error('La Union falló con el código de salida:', code);
			}
		});
	});
};
const renameVideo = (path, newPath) => {
	return new Promise((resolve) => {
		fs.rename(path, newPath, (error) => {
			if (error) {
				console.log('error al renombrar', error);
			} else {
				// console.log('renombrado')
				resolve(newPath);
			}
		});
	});
};

function encodeInvalidCharacters(fileName) {
	const invalidChars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|'];

	let encodedFileName = '';
	for (let i = 0; i < fileName.length; i++) {
		const char = fileName[i];
		if (invalidChars.includes(char)) {
			if (char === '*') {
				encodedFileName += '%2A';
			} else {
				encodedFileName += encodeURIComponent(char);
			}
		} else {
			encodedFileName += char;
		}
	}

	return encodedFileName;
}

const generateRandomName = () => {
	const characters =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const nameLength = 8;

	let randomName = '';
	for (let i = 0; i < nameLength; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		randomName += characters[randomIndex];
	}

	return randomName;
};

const deleteFile = (arrayFiles) => {
	arrayFiles.map((fileName) => {
		fs.unlink(fileName, (err) => {
			if (err) {
				console.error('Error al borrar el archivo:', err);
			} else {
				// console.log('Archivo borrado exitosamente:', fileName);
			}
		});
	});
};

const downloadVideoS = async ({
	url,
	resolution,
	audioOnly,
	allowLowerQuality,
	onProgress,
	onWarning,
}) => {
	let pathVideo = '';
	try {
		pathVideo = await downloadVideo({
			url,
			resolution,
			audioOnly,
			allowLowerQuality: false,
			onProgress,
		});
	} catch (error) {
		console.log(error);

		const errorMessage = error.message;

		const notAvailableMsg = 'Requested format is not available';
		const isFormatAvailable = !errorMessage.includes(notAvailableMsg);
		if (errorMessage.startsWith('ERROR:') && !isFormatAvailable) {
			// console.warn(
			// 	`⚠️ No se encontró resolución exacta (${resolution}p). Usando calidad menor o igual disponible...`
			// );

			console.error(`Error ejecutando yt-dlp: ${errorMessage}`);
			// return reject('noResolutionAvailable');

			if (!allowLowerQuality) {
				throw new Error('⚠️ Resolución exacta no disponible');
			}

			console.warn(' Reintentando con calidad menor o igual');

			if (onWarning) {
				console.log('se ejecuta onWarning');
				await onWarning({
					text: '⚠️ Resolución exacta no disponible. Reintentando con calidad menor o igual...',
				});
			}

			try {
				pathVideo = await downloadVideo({
					url,
					resolution,
					audioOnly,
					allowLowerQuality,
					onProgress,
					onWarning,
				});
			} catch (fallbackError) {
				console.error('❌ Fallback también falló:', fallbackError);

				throw new Error(
					'❌ No se pudo descargar el video con ninguna calidad disponible.'
				);
			}
		} else {
			console.error(`Error inesperado ejecutando yt-dlp: ${errorMessage}`);
			throw new Error('❌ Error inesperado');
		}
	}

	return pathVideo;
};

// Tokenizar input
function tokenize(input) {
	return (
		input
			.match(/"[^"]*"|\S+/g)
			?.map((token) => token.replace(/^"(.+)"$/, '$1')) || []
	);
}

// Detectar comando,argumentos y flags
function parseCLI(input, config) {
	// Tokenizamos
	const tokens = tokenize(input.trim());

	if (!tokens.length) {
		throw new Error('No se proporcionó ningún comando.');
	}

	// Extraer nombre del comando
	const commandName = tokens[0];
	// console.log('Comando detectado:', commandName);
	if (commandName !== config.name) {
		throw new Error(
			`Se esperaba el comando "${config.name}", pero se recibió "${commandName}".`
		);
	}

	//Soporte opcional para "help"
	if (config.allowHelp && (tokens[1] === 'help' || tokens[1] === '--help')) {
		return { command: commandName, help: true };
	}

	// Resultado inicial
	const result = { command: commandName, args: {}, options: {} };

	// Procesar argumentos posicionales
	// Empezamos en 1 porque el índice 0 es el comando
	let i = 1;
	for (const argDef of config.args || []) {
		const next = tokens[i];
		// console.log(`Revisando posicional "${argDef.name}" en token[${i}]:`, next);

		if (!next || next.startsWith('-')) {
			if (argDef.required) {
				throw new Error(`Falta el argumento obligatorio: ${argDef.name}`);
			} else {
				// console.log(`→ "${argDef.name}" es opcional y no estaba.`);
				continue;
			}
		}

		result.args[argDef.name] = next;
		// console.log(`→ Asignado args.${argDef.name} = "${next}"`);
		i++;
	}

	// Proceso de flags
	for (; i < tokens.length; i++) {
		const token = tokens[i];
		// console.log(`Procesando flag/token[${i}]:`, token);

		// Buscar definición de flag
		const flagDef = (config.flags || []).find(
			(f) => f.alias === token || f.name === token
		);
		if (!flagDef) {
			throw new Error(`Opción desconocida: ${token}`);
		}
		// console.log('→ Flag reconocida:', flagDef);

		// Value implícito
		if (flagDef.value !== undefined) {
			result.options[flagDef.name] = flagDef.value;
			// console.log(`→ options.${flagDef.name} = ${flagDef.value} (value implícito)`);
			continue;
		}

		// Boolean
		if (flagDef.type === 'boolean') {
			result.options[flagDef.name] = true;
			// console.log(`→ options.${flagDef.name} = true (boolean flag)`);
			continue;
		}

		// String o Number → consumir siguiente token
		const raw = tokens[++i];
		// console.log(`→ Leyendo valor para "${flagDef.alias}" desde token[${i}]:`, raw);
		if (!raw || raw.startsWith('-')) {
			throw new Error(`La opción ${flagDef.alias} requiere un valor.`);
		}
		const parsedValue = flagDef.type === 'number' ? Number(raw) : raw;
		result.options[flagDef.name] = parsedValue;
		// console.log(`→ options.${flagDef.name} = ${parsedValue}`);
	}

	// console.log('Resultado final:', result);
	return result;
}

import Innertube from 'youtubei.js';

async function getUniqueQualities(videoID) {
	try {
		const innertube = await Innertube.create();

		// const videoID = 'dQw4w9WgXcQ';

		const videoInfo = await innertube.getBasicInfo(videoID);

		const formats = [
			...(videoInfo.streaming_data.formats || []),
			...(videoInfo.streaming_data.adaptive_formats || []),
		];

		const qualityMap = new Map();

		const audioFormats = formats.filter(
			(fmt) => !fmt.height && fmt.mime_type?.includes('audio')
		);

		if (audioFormats.length > 0) {
			// ordenar por bitrate descendente y elegir el mejor
			const bestAudio = audioFormats.sort(
				(a, b) => (b.bitrate || 0) - (a.bitrate || 0)
			)[0];

			qualityMap.set('audio', {
				resolution: 'audio',
				// ext: bestAudio.mime_type.includes('mp4') ? 'm4a' : 'webm',
				ext: 'mp3',
				itag: bestAudio.itag,
				bitrate: bestAudio.bitrate,
			});
		}

		formats.forEach((fmt) => {
			const resolution = fmt.height;
			if (!resolution) return; // descartar si es solo audio

			if (!qualityMap.has(resolution)) {
				qualityMap.set(resolution, {
					// itag: fmt.itag,
					resolution,
					ext: 'mp4',
					// mime_type: fmt.mime_type,
					// codec: fmt.mime_type?.split('codecs="')[1]?.replace('"', ''),
					// has_audio: !!fmt.audio_quality || fmt.mime_type.includes('audio'),
					// container: fmt.mime_type?.split(';')[0],
				});
			}
		});

		// Ordenar por resolución
		const ordered = Array.from(qualityMap.values()).sort((a, b) => {
			if (a.resolution === 'audio') return -1;
			if (b.resolution === 'audio') return 1;
			return parseInt(a.resolution) - parseInt(b.resolution);
		});

		return ordered;
	} catch (err) {
		console.error('Error al obtener calidades:', err.message);

		throw new Error('No se pudieron obtener las calidades');
	}
}

function updateYtDlp() {
	return new Promise((resolve, reject) => {
		const updater = spawn(ytdlpPath, ['-U']); // -U = update

		let output = '';
		let errorOutput = '';

		updater.stdout.on('data', (data) => {
			output += data.toString();
		});

		updater.stderr.on('data', (data) => {
			errorOutput += data.toString();
		});

		updater.on('close', (code) => {
			if (code === 0) {
				console.log('✅ yt-dlp actualizado correctamente.');
				resolve(output.trim());
			} else {
				reject(
					new Error(`❌ Error actualizando yt-dlp: ${errorOutput.trim()}`)
				);
			}
		});
	});
}

async function isFileUnderSizeLimit(filePath, maxSizeMB = 100) {
	try {
		const { size: fileSizeBytes } = await fsPromises.stat(filePath);
		const maxSizeBytes = maxSizeMB * 1024 * 1024;

		return fileSizeBytes < maxSizeBytes;
	} catch (error) {
		console.error('Failed to read file info:', error);
		return false; // safe fallback
	}
}

async function loadTexts(basePath, overridePath) {
	let base = {};
	let override = {};

	try {
		base = await import(basePath, { with: { type: 'json' } });
	} catch {}

	try {
		override = await import(overridePath, { with: { type: 'json' } });
	} catch {}

	return { ...base.default, ...override.default };
}

export {
	getDataSearch,
	parseSearchData,
	messageCustomFormat,
	// convertMP3,
	parseStringValues2,
	parseStringValues,
	evalu,
	evalu2,
	dataInfoMesague,
	getVideoInfo,
	getVideoInfo2,
	downloadG,
	downloadVideo,
	downloadVideoS,
	joinVideoAndAudio,
	// totalFileSize,
	// checkTotalFileSize,
	renameVideo,
	generateRandomName,
	deleteFile,
	parseCLI,
	getUniqueQualities,
	updateYtDlp,
	isFileUnderSizeLimit,
	loadTexts,
};
