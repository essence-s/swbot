import { DW } from './dw.js';
// import { INFO } from './info.js';
import { MEME } from './meme.js';
import { SYT } from './syt.js';

export const INFO = {
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
					const superDino = [INFO, DW, MEME, SYT];

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
