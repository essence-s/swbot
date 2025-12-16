import type { Command } from '../../lbSbot/types/command.ts';
import {
	deleteFile,
	downloadVideoS,
	isFileUnderSizeLimit,
	parseCLI,
} from '../../utils.ts';
import { config } from './config.ts';

export const DW: Command = {
	invo: '.dw',
	shortDescription:
		'Descarga videos o audios fácilmente con diferentes formatos y calidades.',
	description: `
📥 *Descargar videos o audios*

Usa el comando con el enlace del video y agrega las opciones para elegir formato y calidad.

🧩 *Ejemplo:*
.dw https://www.ejemplo.com -mp3 → descarga solo el audio con la mejor calidad disponible.
.dw https://www.ejemplo.com -720 → descarga el video en MP4 con calidad 720p.

⚙️ *Opciones disponibles:*
🎬 *-mp4* → Descargar el video
🎵 *-mp3* → Descargar solo el audio
📺 *-360*, *-420*, *-720*, *-890* → Elegir la calidad del video (de menor a mayor)
`,
	onImmediateExecute: async ({
		ctx,
		messageText,
		data: dataUser,
		sendMessage,
		endFlow,
		redirectToSubflow,
	}) => {
		// const message = ctx.messages[0].message.conversation;

		try {
			const parsed: any = parseCLI(messageText, config);
			// const result = {
			// 	command: '.dw',
			// 	args: { url: 'https://youtube.com' },
			// 	options: { format: 'mp4', resolution: 360 },
			// };

			if (parsed.help) {
				redirectToSubflow('help');
				return;
			}

			// si encuentra en el mensaje un url valido de la lista de yt-dlp redirige al subflujo de descarga rápida
			const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;
			const match = parsed?.args?.url?.match(urlRegex);
			if (match) {
				dataUser.parsed = parsed;
				console.log(match[0]);
				redirectToSubflow('fastDownload');

				// redireccion
			} else if (messageText.includes('dino')) {
				redirectToSubflow('search');
			}
		} catch (err: any) {
			console.error('Error:', err.message);
		}
	},
	defaultSubFlow: 'search',
	subFlows: {
		help: [
			{
				action: async ({ ctx, sendMessage, endFlow }) => {
					sendMessage({
						text: DW.description,
					});
					// endFlow({ text: 'dino' });
				},
			},
		],
		search: [
			{
				action: async ({ ctx, sendMessage, endFlow, messageText }) => {
					sendMessage({ text: `buscando video. ${messageText}` });
				},
			},
		],
		fastDownload: [
			{
				action: async ({
					ctx,
					data: dataUser,
					sendMessage,
					sendFile,
					sendSticker,
					updateMessage,
					endFlow,
				}) => {
					let urlVideo = dataUser.parsed.args.url;
					let flagsOptions = dataUser.parsed.options;

					// envio de sticker de descargando
					// await sendSticker({
					// 	filePath: './assets/loader_video3.webp',
					// 	options: { reply: true },
					// });

					// envio de mensaje de descarga
					const msg = await sendMessage({
						text: `📥 Descargando ... [░░░░░░░░░░] 0%`,
						// options: { reply: true },
					});

					// descarga y devuelve la ubicacion del video descargado
					let pathVideo = '';
					const resolution = flagsOptions.resolution || '720'; // por defecto 720
					const format = flagsOptions.format;
					const wantsMp3 = format === 'mp3'; // si el formato es mp3, solo descarga el audio
					const wantsMp4 = format === 'mp4' || (!wantsMp3 && format == null);

					const forceFile = flagsOptions.fileMode === true;

					try {
						pathVideo = await downloadVideoS({
							url: urlVideo,
							resolution,
							audioOnly: wantsMp3,
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

					const isUnderLimit = await isFileUnderSizeLimit(pathVideo);
					// si el archivo es menor a 100MB
					// se esta subiendo el archivo que sera la respuesta del mensaje "reply"
					if (forceFile) {
						await sendFile({ filePath: pathVideo, options: { reply: true } });
					} else if (isUnderLimit && wantsMp4) {
						await sendFile({
							filePath: pathVideo,
							options: { reply: true, type: 'video' },
						});
						console.log('File is under 100MB. Sent as video.');
					} else if (isUnderLimit && wantsMp3) {
						await sendFile({
							filePath: pathVideo,
							options: { reply: true, type: 'audio', ptt: false },
						});
						console.log('File is under 100MB. Sent as video.');
					} else {
						await sendFile({ filePath: pathVideo, options: { reply: true } });
						console.log('File exceeds 100MB ');
					}

					// elimino el video para no ocupar espacio
					deleteFile([pathVideo]);

					// actualizar el mensaje de decarga y procesamiento terminada
					await updateMessage({
						text: `✅ ${
							wantsMp3 ? 'Audio' : 'Video'
						} descargado y enviado correctamente. [▓▓▓▓▓▓▓▓▓▓] 100%`,
						key: msg.key,
					});
				},
			},
		],
	},
};
