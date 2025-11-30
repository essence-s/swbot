import type { CliConfig } from '../../utils.ts';

export const config: CliConfig = {
	name: '.dw',
	allowHelp: true,
	args: [{ name: 'url', required: true }],
	flags: [
		{ name: 'format', alias: '-mp4', type: 'boolean', value: 'mp4' },
		{ name: 'format', alias: '-mp3', type: 'boolean', value: 'mp3' },

		{ name: 'fileMode', alias: '-file', type: 'boolean', value: true },
		// { name: 'output', alias: '-o', type: 'string' },

		// Resoluciones como flags individuales pero apuntando a la misma key
		{ name: 'resolution', alias: '-890', type: 'boolean', value: 890 },
		{ name: 'resolution', alias: '-720', type: 'boolean', value: 720 },
		{ name: 'resolution', alias: '-420', type: 'boolean', value: 420 },
		{ name: 'resolution', alias: '-360', type: 'boolean', value: 360 },
	],
};
