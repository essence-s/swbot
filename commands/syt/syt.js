import {
	dataInfoMesague,
	deleteFile,
	downloadVideoS,
	evalu,
	evalu2,
	getDataSearch,
	getUniqueQualities,
	isFileUnderSizeLimit,
	messageCustomFormat,
	parseSearchData,
	parseStringValues,
	parseStringValues2,
	loadTexts,
} from '../../utils.js';

import { addSeletedVideoInfo, getDataUser, saveData } from '../../adp.js';

const texts = await loadTexts(
	'./commands/syt/base.json',
	'./commands/syt/override.json'
);

export const SYT = {
	invo: '.syt',
	description: 'Busca y descargar videos o audios de YouTube',
	shortDescription: 'Busca y descargar videos o audios de YouTube',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		redirectToSubflow('search');
	},
	defaultSubFlow: 'search',
	subFlows: {
		search: [
			{
				word: texts.steps[0],
				action: async ({ ctx, sendMessage, endFlow }) => {
					let message = ctx.messages[0].message.conversation;
					let pushName = ctx.messages[0].pushName;

					if (message.toLowerCase() == 'exit')
						return endFlow({ text: 'saliste 🏃‍♀️' });

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
				word: texts.steps[1],
				action: async ({
					ctx,
					sendMessage,
					fallBack,
					updateMessage,
					endFlow,
				}) => {
					let message = ctx.messages[0].message.conversation;
					let pushName = ctx.messages[0].pushName;
					if (message.toLowerCase() == 'exit')
						return endFlow({ text: 'saliste 🏃‍♀️' });
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

						const msgPromise = sendMessage({
							text: 'Obteniendo información del video...',
						});

						try {
							const [msg, datainfoQualitys] = await Promise.all([
								msgPromise,
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

							await updateMessage({
								text: infoMessague,
								key: msg.key,
							});
						} catch (err) {
							const msg = await msgPromise;
							await updateMessage({
								text: `${err.message}\nPor favor, vuelva a intentarlo.`,
								key: msg.key,
							});
							return fallBack();
						}
					} else if (evaluated.mode == 2) {
						await fallBack();
					}
				},
			},
			{
				word: texts.steps[2],
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
					if (message.toLowerCase() == 'exit')
						return endFlow({ text: 'saliste 🏃‍♀️' });
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
					let urlVideo = dataUser.selectedVideoInfo.videoUrl;
					let evaluado = evalu2(
						optionsObject.format,
						optionsObject.numOptionQuality
					);

					let selectedVideo =
						dataUser.dataQualitys[parseInt(evaluado.numOptionQuality) - 1];

					if (selectedVideo?.ext == 'mp3') {
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

						const isUnderLimit = await isFileUnderSizeLimit(pathVideo);
						// si el archivo es menor a 100MB
						// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
						if (isUnderLimit) {
							await sendFile({
								filePath: pathVideo,
								options: { reply: true, type: 'video' },
							});
							console.log('File is under 100MB. Sent as video.');
						} else {
							await sendFile({ filePath: pathVideo, options: { reply: true } });
							console.log(
								'File exceeds 100MB. Sent as a document instead of video.'
							);
						}

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
