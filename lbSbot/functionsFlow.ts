import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import type {
	DeleteMessage,
	EndFlow,
	FallBack,
	SendFile,
	SendMessage,
	SendSticker,
	UpdateMessage,
} from './types/functionsFlow.ts';
import type { User } from './users.ts';
import type { Command, SubFlowStep } from './types/command.ts';
// const toAsyncIterator = require('stream-to-async-iterator');

type FinalOptions = {
	quoted?: string;
};

type Sock = {
	sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
};

type FilePath = string | { url: string };

class FunctionsFlow {
	sock: Sock;
	remoteJid: string;
	msg: any;

	dataUser: User;
	flow: Partial<Command> = {};
	statusFallBack: boolean;

	subFlow: SubFlowStep[];
	nameSubFlow: string;

	constructor(sock: Sock, remoteJid: string, msg: any) {
		this.sock = sock;
		this.remoteJid = remoteJid;
		this.msg = msg;

		this.dataUser = {};
		this.flow = {};
		this.statusFallBack = false;

		this.subFlow = [];
		this.nameSubFlow = '';
	}

	sendMessage: SendMessage = async ({ text, options = { reply: false } }) => {
		// console.log(this.statusFallBack)
		const finalOptions: FinalOptions = {};
		if (options.reply) finalOptions.quoted = this.msg;

		return await this.sock.sendMessage(
			this.remoteJid,
			{ text: text },
			finalOptions
		);
	};

	deleteMessage: DeleteMessage = async ({ key }) => {
		if (!key) {
			throw new Error('Key is required to delete a message');
		}

		return await this.sock.sendMessage(this.remoteJid, { delete: key });
	};

	updateMessage: UpdateMessage = async ({ text, key }) => {
		if (!key) {
			throw new Error('Key is required to update a message');
		}

		return await this.sock.sendMessage(this.remoteJid, { text, edit: key });
	};

	sendFile: SendFile = async ({
		filePath = { url: '' },
		fileName,
		options = { reply: false, type: 'document', caption: '', ptt: false },
	}) => {
		const finalOptions: FinalOptions = {};
		if (options.reply) finalOptions.quoted = this.msg;

		if (!filePath) {
			throw new Error('filePath es obligatorio');
		}

		let fileSource;
		let mimeType;
		let newFileName;

		const isUrl = typeof filePath === 'object' && filePath.url;

		if (isUrl) {
			fileSource = { url: filePath.url };
			mimeType = mime.lookup(filePath.url) || 'application/octet-stream';
			newFileName = fileName || path.basename(filePath.url) || 'file';
		} else if (typeof filePath === 'string') {
			fileSource = fs.readFileSync(filePath);
			mimeType = mime.lookup(filePath) || 'application/octet-stream';
			newFileName = fileName || path.basename(filePath) || 'file';
		} else {
			throw new Error(
				'filePath debe ser una string o un objeto con propiedad "url"'
			);
		}

		const type = options.type || 'document';
		let messageContent = {};

		if (type === 'image') {
			messageContent = {
				image: fileSource,
				caption: options.caption || '',
				mimetype: mimeType,
				fileName: newFileName,
			};
		} else if (type === 'video') {
			messageContent = {
				video: fileSource,
				caption: options.caption || '',
				mimetype: mimeType,
				fileName: newFileName,
			};
		} else if (type === 'audio') {
			messageContent = {
				audio: fileSource,
				mimetype: mimeType,
				ptt: options.ptt ?? false,
				fileName: newFileName,
			};
		} else {
			messageContent = {
				document: fileSource,
				mimetype: mimeType,
				fileName: newFileName,
			};
		}

		await this.sock.sendMessage(this.remoteJid, messageContent, finalOptions);
	};

	sendSticker: SendSticker = async ({
		filePath,
		options = { reply: false },
	}) => {
		const finalOptions: FinalOptions = {};
		if (options.reply) finalOptions.quoted = this.msg;

		const mimeType = mime.lookup(filePath);
		const buffer = fs.readFileSync(filePath);
		await this.sock.sendMessage(
			this.remoteJid,
			{
				sticker: buffer,
				mimetype: mimeType,
			},
			finalOptions
		);
	};

	endFlow: EndFlow = async ({ text }) => {
		this.dataUser.currentSection = 0;
		this.dataUser.flowCurrent = '';
		await this.sendMessage({ text });
		this.changeFallback(true);
	};

	fallBack: FallBack = async () => {
		let currentSection = this.dataUser.currentSection;
		if (!currentSection) return console.log('current Section no encontrado');

		const word = this.subFlow[currentSection].word;
		if (!word) return console.log('current Section no encontrado');

		await this.sendMessage({ text: word });
		this.changeFallback(true);
	};

	changeFallback(dataBolean: boolean) {
		this.statusFallBack = dataBolean;
	}

	addDataUser(data: User) {
		this.dataUser = data;
	}

	addFlow(flow: Command) {
		this.flow = flow;
	}

	addSubFlow(subFlow: SubFlowStep[]) {
		this.subFlow = subFlow;
	}

	redirectToSubflow(nameSubFlow: string) {
		// this.subFlow = this.flow.subFlows[subFlow];
		// console.dir(this.flow, { depth: null });
		this.nameSubFlow = nameSubFlow;
		if (!this.subFlow && 'invo' in this.flow) {
			throw new Error(
				`Subflow ${nameSubFlow} not found in flow ${this.flow.invo}`
			);
		}
	}
}

export { FunctionsFlow };
