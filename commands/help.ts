import type { Command } from '../lbSbot/types/command.ts';
import { DW } from './dw/dw.ts';
import { MEME } from './meme.ts';
import { SYT } from './syt/syt.ts';

export const HELP: Command = {
	invo: '.help',
	shortDescription: 'Muestra informacion de todos los comandos',
	description: 'Muestra informacion de todos los comandos',
	onImmediateExecute: async ({}) => {
		// redirectToSubflow('help');
	},
	// defaultSubFlow: 'help',
	subFlows: {
		help: [
			{
				action: async ({ sendMessage }) => {
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
