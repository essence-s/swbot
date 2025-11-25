import { updateYtDlp } from '../utils.ts';

export const UPDATEYTDLP = {
	invo: '.uytdlp',
	description: 'Actualiza yt-dlp a la ultima version',
	shortDescription: 'Actualiza yt-dlp a la ultima version',
	onImmediateExecute: async ({ ctx, sendMessage, redirectToSubflow }) => {
		// let message = ctx.messages[0].message.conversation;

		redirectToSubflow('updateYtDlp');
	},
	defaultSubFlow: 'updateYtDlp',
	subFlows: {
		updateYtDlp: [
			{
				action: async ({ ctx, sendMessage }) => {
					// let message = ctx.messages[0].message.conversation;
					let updated = '';
					try {
						updated = await updateYtDlp();
					} catch (e) {
						updated = `Ocurrio un error al actualizar yt-dlp: ${e.message}`;
					}

					sendMessage({ text: `${updated}` });
				},
			},
		],
	},
};
