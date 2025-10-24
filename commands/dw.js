import { deleteFile, parseCLI, downloadVideoS } from '../utils.js';

export const DW = {
	invo: '.dw',
	description: `
📥 **Descargar videos o audios dd**

Usa el comando con el enlace del video y agrega las opciones para elegir formato y calidad.

🧩 *Ejemplo:*
.dw https://www.ejemplo.com -mp3 → descarga solo el audio con la mejor calidad disponible.
.dw https://www.ejemplo.com -720 → descarga el video en MP4 con calidad 720p.

⚙️ *Opciones disponibles:*
🎬 *-mp4* → Descargar el video
🎵 *-mp3* → Descargar solo el audio
📺 *-360*, *-420*, *-720*, *-890* → Elegir la calidad del video (de menor a mayor)


`,
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
