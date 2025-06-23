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
} = require('./utils');

const { saveData, getDataUser, addSeletedVideoInfo } = require('./adp');

const YTD = {
	invo: '.yt',
	description: 'Descargar videos o audios de YouTube',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		let message = ctx.messages[0].message.conversation;

		// const message = ctx.messages[0].message.conversation;

		// si encuentra en el mensaje un url de yt redirige al subflujo de descarga rápida
		const ytUrlRegex = /^\.yt\s+(https?:\/\/[^\s]+)/i;
		const match = message.match(ytUrlRegex);
		if (match) {
			const data = {
				urlVideo: match[1],
			};
			ctx.data = data;
			console.log(match[1]);
			redirectToSubflow('fastDownload');

			// redireccion
		} else if (message.includes('dino')) {
			redirectToSubflow('search');
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
					let { urlVideo } = ctx.data;

					// envio de sticker de descargando
					await sendSticker({
						filePath: './assets/loader_video3.webp',
						options: { reply: true },
					});

					// envio de mensaje de descarga
					const msg = await sendMessage({
						text: `📥 Descargando video... [▓░░░░░░░] 10%`,
					});

					// descarga y devuelve la ubicacion del video descargado
					let pathVideo = '';
					try {
						pathVideo = await downloadVideo({
							url: urlVideo,
							resolution: '720',
							allowLowerQuality: false,
						});
					} catch (error) {
						console.log(error);

						const isFormatUnavailable = error.includes('noResolutionAvailable');
						if (isFormatUnavailable) {
							console.warn(' Reintentando con calidad menor o igual');
							await updateMessage({
								text: '⚠️ Resolución exacta no disponible. Reintentando con calidad menor o igual...',
								key: msg.key,
							});

							try {
								pathVideo = await downloadVideo({
									url: urlVideo,
									resolution: '720',
									allowLowerQuality: true,
								});
							} catch (fallbackError) {
								console.error('❌ Fallback también falló:', fallbackError);

								await updateMessage({
									text: '❌ No se pudo descargar el video con ninguna calidad disponible.',
									key: msg.key,
								});
								return;
							}
						} else {
							await updateMessage({
								text: '❌ Error inesperado al descargar el video.',
								key: msg.key,
							});
							return endFlow({ text: 'error inesperado' });
						}
					}

					// actualizar mensaje para la subida del archivo
					await updateMessage({
						text: `⚙️ Procesando video... [▓▓▓▓▓░░░] 60%`,
						key: msg.key,
					});

					// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
					await sendFile({ filePath: pathVideo, options: { reply: true } });

					// elimino el video para no ocupar espacio
					deleteFile([pathVideo]);

					// actualizar el mensaje de decarga y procesamiento terminada
					await updateMessage({
						text: `✅ Video descargado y enviado correctamente. [▓▓▓▓▓▓▓▓] 100%`,
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

const superDino = [YTD, MEME];
// connectToWhatsApp(superDino)
let cB = new Connectbaileys(superDino);
cB.initBailey();
