import { DW } from './dw/dw.ts';
// import { INFO } from './info.js';
import { MEME } from './meme.js';
import { SYT } from './syt/syt.ts';

export const HELP = {
	invo: '.help',
	shortDescription: 'Muestra informacion de todos los comandos',
	description: 'Muestra informacion de todos los comandos',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		let message = ctx.messages[0].message.conversation;

		// redirectToSubflow('help');
	},
	// defaultSubFlow: 'help',
	subFlows: {
		help: [
			{
				action: async ({ ctx, sendMessage }) => {
					// let message = ctx.messages[0].message.conversation;
					const superDino = [HELP, DW, MEME, SYT];

					sendMessage({
						text: `Comandos disponibles:\n\n${superDino
							.map((cmd) => `- ${cmd.invo} ${cmd.shortDescription}`)
							.join('\n')}`,
					});
				},
			},
		],
	},
};
