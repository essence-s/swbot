const { Connectbaileys } = require('./lbSbot/GG.js');
const {
	getDataSearch,
	parseSearchData,
	messageCustomFormat,
	parseStringValues,
	parseStringValues2,
	evalu,
	evalu2,
	dataInfoMesague,
	getVideoInfo,
	downloadG,
	joinVideoAndAudio,
	totalFileSize,
	checkTotalFileSize,
	renameVideo,
	convertMP3,
	generateRandomName,
	deleteFile,
	getVideoInfo2,
	downloadVideo,
	parseCLI,
	downloadVideoS,
	getUniqueQualities,
} = require('./utils');

const { saveData, getDataUser, addSeletedVideoInfo } = require('./adp');

const YTD = {
	invo: '.dw',
	description: 'Descargar videos o audios de algunas plataformas',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		let message = ctx.messages[0].message.conversation;

		// const message = ctx.messages[0].message.conversation;
		const config = {
			name: '.dw',
			args: [{ name: 'url', required: true }],
			flags: [
				{ name: 'format', alias: '-mp4', type: 'boolean', value: 'mp4' },
				{ name: 'format', alias: '-mp3', type: 'boolean', value: 'mp3' },
				// { name: 'output', alias: '-o', type: 'string' },

				// Resoluciones como flags individuales pero apuntando a la misma key
				{ name: 'resolution', alias: '-890', type: 'boolean', value: 890 },
				{ name: 'resolution', alias: '-720', type: 'boolean', value: 720 },
				{ name: 'resolution', alias: '-420', type: 'boolean', value: 420 },
				{ name: 'resolution', alias: '-360', type: 'boolean', value: 360 },
			],
		};

		try {
			const parsed = parseCLI(message, config);
			// const result = {
			// 	command: '.dw',
			// 	args: { url: 'https://youtube.com' },
			// 	options: { format: 'mp4', resolution: 360 },
			// };

			// si encuentra en el mensaje un url valido de la lista de yt-dlp redirige al subflujo de descarga rápida
			const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
			const match = parsed?.args?.url?.match(urlRegex);
			if (match) {
				const data = {
					// urlVideo: match[0],
					parsed,
				};
				ctx.data = data;
				console.log(match[0]);
				redirectToSubflow('fastDownload');

				// redireccion
			} else if (message.includes('dino')) {
				redirectToSubflow('search');
			}
		} catch (err) {
			console.error('Error:', err.message);
		}
	},
	defaultSubFlow: 'search',
	subFlows: {
		search: [
			{
				action: async ({ ctx, sendMessage, endFlow }) => {
					let message = ctx.messages[0].message.conversation;
					sendMessage({ text: `buscando video. ${message}` });
				},
			},
		],
		fastDownload: [
			{
				action: async ({
					ctx,
					sendMessage,
					sendFile,
					sendSticker,
					updateMessage,
					endFlow,
				}) => {
					let message = ctx.messages[0].message.conversation;
					let urlVideo = ctx.data.parsed.args.url;
					let flagsOptions = ctx.data.parsed.options;

					// envio de sticker de descargando
					await sendSticker({
						filePath: './assets/loader_video3.webp',
						options: { reply: true },
					});

					// envio de mensaje de descarga
					const msg = await sendMessage({
						text: `📥 Descargando ... [░░░░░░░░░░] 0%`,
					});

					// descarga y devuelve la ubicacion del video descargado
					let pathVideo = '';
					const resolution = flagsOptions.resolution || '720'; // por defecto 720
					const audioOnly = flagsOptions.format === 'mp3'; // si el formato es mp3, solo descarga el audio

					try {
						pathVideo = await downloadVideoS({
							url: urlVideo,
							resolution,
							audioOnly,
							allowLowerQuality: true,
							onProgress: (progress) => {
								// console.log(progress);
								const percent = Number(progress.percent);
								const totalBlocks = 10;
								const filledBlocks = Math.round((percent / 100) * totalBlocks);
								const emptyBlocks = totalBlocks - filledBlocks;

								const bar =
									'[' +
									'▓'.repeat(filledBlocks) +
									'░'.repeat(emptyBlocks) +
									']';

								updateMessage({
									text: `📥 Descargando ${
										progress.type
									}... ${bar} ${percent.toFixed(1)}%`,
									key: msg.key,
								});
							},
							onWarning: ({ text }) => {
								console.warn('⚠️ Warning:', text);
								updateMessage({
									text,
									key: msg.key,
								});
							},
						});
					} catch (error) {
						console.log(error);

						return endFlow({ text: 'error inesperado' });
					}

					// actualizar mensaje para la subida del archivo
					await updateMessage({
						text: `⚙️ Procesando video... [▓░░░░░░░░░] 10%`,
						key: msg.key,
					});

					// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
					await sendFile({ filePath: pathVideo, options: { reply: true } });

					// elimino el video para no ocupar espacio
					deleteFile([pathVideo]);

					// actualizar el mensaje de decarga y procesamiento terminada
					await updateMessage({
						text: `✅ Video descargado y enviado correctamente. [▓▓▓▓▓▓▓▓▓▓] 100%`,
						key: msg.key,
					});
				},
			},
		],
	},
};

const MEME = {
	invo: '.mm',
	description: 'envia un meme aleatorio',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		let message = ctx.messages[0].message.conversation;

		redirectToSubflow('meme');
	},
	defaultSubFlow: 'meme',
	subFlows: {
		meme: [
			{
				action: async ({ ctx, sendMessage, sendFile }) => {
					let message = ctx.messages[0].message.conversation;

					const getRandomMeme = () => {
						return fetch('https://meme-api.com/gimme/MexicoMemes')
							.then((response) => response.json())
							.then((data) => {
								if (data.nsfw) {
									return getRandomMeme();
								} else {
									return data.url;
								}
							})
							.catch((error) => {
								console.error('Error al obtener el meme:', error);
								return null;
							});
					};

					const meme = await getRandomMeme();
					sendFile({
						filePath: { url: meme },
						options: { reply: true, caption: 'Meme aleatorio', type: 'image' },
					});
					// sendMessage({ text: `Enviando meme aleatorio...` });
				},
			},
		],
	},
};

const INFO = {
	invo: '.info',
	description: 'Muestra informacion de todos los comandos',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		let message = ctx.messages[0].message.conversation;

		redirectToSubflow('info');
	},
	defaultSubFlow: 'info',
	subFlows: {
		info: [
			{
				action: async ({ ctx, sendMessage }) => {
					// let message = ctx.messages[0].message.conversation;
					sendMessage({
						text: `Comandos disponibles:\n\n${superDino
							.map((cmd) => `- ${cmd.invo} ${cmd.description}`)
							.join('\n')}`,
					});
				},
			},
		],
	},
};

const SYT = {
	invo: '.syt',
	description: 'Busca y descargar videos o audios de YouTube',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		redirectToSubflow('search');
	},
	defaultSubFlow: 'search',
	subFlows: {
		search: [
			{
				word: 'Escriba su búsqueda :V',
				action: async ({ ctx, sendMessage, endFlow }) => {
					let message = ctx.messages[0].message.conversation;
					let pushName = ctx.messages[0].pushName;

					if (message.toLowerCase() == 'exit') return endFlow('exit');

					let { items } = await getDataSearch(`${message}`, 5);
					let parsedData = parseSearchData(items);

					saveData(pushName, (dataAct) => {
						return {
							...dataAct,
							pushName: pushName,
							dataSaveSearch: parsedData,
						};
					});

					let dataFormatTextSend = messageCustomFormat(parsedData);
					// await flowDynamic({ body: dataFormatTextSend })
					// await sendMessage(dataFormatTextSend);
					await sendMessage({ text: dataFormatTextSend });
				},
			},
			{
				word: 'Elija con un numero y espere...',
				action: async ({
					ctx,
					sendMessage,
					fallBack,
					updateMessage,
					endFlow,
				}) => {
					let message = ctx.messages[0].message.conversation;
					let pushName = ctx.messages[0].pushName;
					if (message.toLowerCase() == 'exit') return endFlow('exit');
					let optionsObject = parseStringValues(message);

					let evaluated = evalu(
						optionsObject.option,
						optionsObject.format,
						optionsObject.quality
					);
					if (evaluated == 'noDataOption') {
						// console.log('fallback')
						return fallBack();
					}

					addSeletedVideoInfo(pushName, evaluated.dataOptions.option - 1);

					saveData(pushName, (dataAct) => {
						return {
							...dataAct,
							dataOptions: { ...evaluated.dataOptions },
						};
					});

					let url = getDataUser(pushName).selectedVideoInfo.videoId;

					if (evaluated.mode == 1) {
						// const msg = await sendMessage({
						// 	text: `Obteniendo informacion del video...`,
						// });

						// let datainfoQualitys = await getUniqueQualities(url);

						const [msg, datainfoQualitys] = await Promise.all([
							sendMessage({
								text: `Obteniendo informacion del video...`,
							}),
							getUniqueQualities(url),
						]);

						// let datainfoQualitys = await getVideoInfo2(url);

						saveData(pushName, (dataAct) => {
							return {
								...dataAct,
								dataQualitys: datainfoQualitys,
							};
						});

						// console.log(datainfoQualitys);
						let infoMessague = dataInfoMesague(datainfoQualitys);

						// console.log(infoMessague);
						// await sendMessage(infoMessague);
						// sendMessage({ text: infoMessague });
						await updateMessage({
							text: infoMessague,
							key: msg.key,
						});
					} else if (evaluated.mode == 2) {
						await fallBack();
					}
				},
			},
			{
				word: 'Elija con un numero la calidad y con letras el formato ejemplo: \n 1 mp3 \n Si no se escoje el formato sera mp4',
				action: async ({
					ctx,
					sendMessage,
					sendFile,
					sendSticker,
					updateMessage,
					endFlow,
				}) => {
					let message = ctx.messages[0].message.conversation;
					let pushName = ctx.messages[0].pushName;
					if (message.toLowerCase() == 'exit') return endFlow('exit');
					let dataUser = getDataUser(pushName);
					let cantVideos = dataUser.dataQualitys.length;
					const createArrayNum = (num) => {
						let arrayOptinosLengthVideos = [];
						for (let i = 1; i <= num; i++) {
							arrayOptinosLengthVideos.push(i);
						}
						return arrayOptinosLengthVideos;
					};
					let optionsObject = parseStringValues2(
						message,
						createArrayNum(cantVideos)
					);
					let urlVideo = dataUser.selectedVideoInfo.videoId;
					let evaluado = evalu2(
						optionsObject.format,
						optionsObject.numOptionQuality
					);
					if (evaluado.format == 'mp3') {
						// envio de mensaje de descarga
						const msg = await sendMessage({
							text: `📥 Descargando audio... [▓░░░░░░░░░] 10%`,
						});

						let pathVideo = '';

						const audioOnly = true; //'mp3'; // si el formato es mp3, solo descarga el audio

						try {
							pathVideo = await downloadVideoS({
								url: urlVideo,
								// resolution,
								audioOnly,
								allowLowerQuality: true,
								onProgress: (progress) => {
									// console.log(progress);
									const percent = Number(progress.percent);
									const totalBlocks = 10;
									const filledBlocks = Math.round(
										(percent / 100) * totalBlocks
									);
									const emptyBlocks = totalBlocks - filledBlocks;

									const bar =
										'[' +
										'▓'.repeat(filledBlocks) +
										'░'.repeat(emptyBlocks) +
										']';

									updateMessage({
										text: `📥 Descargando ${
											progress.type
										}... ${bar} ${percent.toFixed(1)}%`,
										key: msg.key,
									});
								},
								onWarning: ({ text }) => {
									console.warn('⚠️ Warning:', text);
									updateMessage({
										text,
										key: msg.key,
									});
								},
							});
						} catch (error) {
							console.log(error);

							return endFlow({ text: 'error inesperado' });
						}

						// actualizar mensaje para la subida del archivo
						await updateMessage({
							text: `🎵 Procesando Audio... [▓░░░░░░░░░] 10%`,
							key: msg.key,
						});

						// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
						await sendFile({ filePath: pathVideo, options: { reply: true } });

						// elimino el video para no ocupar espacio
						deleteFile([pathVideo]);

						// actualizar el mensaje de decarga y procesamiento terminada
						await updateMessage({
							text: `✅ Audio descargado y enviado correctamente. [▓▓▓▓▓▓▓▓▓▓] 100%`,
							key: msg.key,
						});
					} else {
						let selectedVideo =
							dataUser.dataQualitys[parseInt(evaluado.numOptionQuality) - 1];
						// let pathVideo = await downloadG2(selectedVideo);
						// console.log(selectedVideo);
						// envio de mensaje de descarga
						const msg = await sendMessage({
							text: `📥 Descargando video... [▓░░░░░░░░░] 10%`,
						});

						let pathVideo = '';
						const resolution = selectedVideo?.resolution || '480'; // por defecto 480

						try {
							pathVideo = await downloadVideoS({
								url: urlVideo,
								resolution,
								allowLowerQuality: true,
								onProgress: (progress) => {
									// console.log(progress);
									const percent = Number(progress.percent);
									const totalBlocks = 10;
									const filledBlocks = Math.round(
										(percent / 100) * totalBlocks
									);
									const emptyBlocks = totalBlocks - filledBlocks;

									const bar =
										'[' +
										'▓'.repeat(filledBlocks) +
										'░'.repeat(emptyBlocks) +
										']';

									updateMessage({
										text: `📥 Descargando ${
											progress.type
										}... ${bar} ${percent.toFixed(1)}%`,
										key: msg.key,
									});
								},
								onWarning: ({ text }) => {
									console.warn('⚠️ Warning:', text);
									updateMessage({
										text,
										key: msg.key,
									});
								},
							});
						} catch (error) {
							console.log(error);

							return endFlow({ text: 'error inesperado' });
						}

						// actualizar mensaje para la subida del archivo
						await updateMessage({
							text: `⚙️ Procesando video... [▓░░░░░░░░░] 10%`,
							key: msg.key,
						});

						// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
						await sendFile({ filePath: pathVideo, options: { reply: true } });

						// elimino el video para no ocupar espacio
						deleteFile([pathVideo]);

						// actualizar el mensaje de decarga y procesamiento terminada
						await updateMessage({
							text: `✅ Video descargado y enviado correctamente. [▓▓▓▓▓▓▓▓▓▓] 100%`,
							key: msg.key,
						});
					}
				},
			},
		],
	},
};

const superDino = [INFO, YTD, MEME, SYT];
// connectToWhatsApp(superDino)
let cB = new Connectbaileys(superDino);
cB.initBailey();
