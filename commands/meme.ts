import type { Command } from '../lbSbot/types/command';

export const MEME: Command = {
	invo: '.mm',
	description: 'envia un meme aleatorio',
	shortDescription: 'envia un meme aleatorio',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		redirectToSubflow('meme');
	},
	defaultSubFlow: 'meme',
	subFlows: {
		meme: [
			{
				action: async ({ ctx, sendMessage, sendFile }) => {
					const getRandomMeme = (): Promise<string> => {
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
