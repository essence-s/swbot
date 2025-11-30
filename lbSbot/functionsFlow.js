import mime from 'mime-types';
import fs from 'fs';
import { Readable } from 'stream';
import path from 'path';
import { url } from 'inspector';
// const toAsyncIterator = require('stream-to-async-iterator');

class FunctionsFlow {
	constructor(sock, remoteJid, msg) {
		this.sock = sock;
		this.remoteJid = remoteJid;
		this.msg = msg;

		this.dataUser = {};
		this.flow = {};
		this.statusFallBack = false;

		this.subFlow = [];
		this.nameSubFlow = '';
	}

	async sendMessage({ text, options = { reply: false } }) {
		// console.log(this.statusFallBack)
		const finalOptions = {};
		if (options.reply) finalOptions.quoted = this.msg;

		return await this.sock.sendMessage(
			this.remoteJid,
			{ text: text },
			finalOptions
		);
	}

	async deleteMessage({ key }) {
		if (!key) {
			throw new Error('Key is required to delete a message');
		}

		return await this.sock.sendMessage(this.remoteJid, { delete: key });
	}

	async updateMessage({ text, key }) {
		if (!key) {
			throw new Error('Key is required to update a message');
		}

		return await this.sock.sendMessage(this.remoteJid, { text, edit: key });
	}

	async sendFile({
		filePath = { url: '' },
		fileName,
		options = { reply: false, type: 'document', caption: '', ptt: false },
	}) {
		const finalOptions = {};
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
	}

	async sendSticker({ filePath, options = { reply: false } }) {
		const finalOptions = {};
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
	}

	async endFlow({ text }) {
		this.dataUser.currentSection = 0;
		this.dataUser.flowCurrent = '';
		await this.sendMessage({ text });
		this.changeFallback(true);
	}

	async fallBack() {
		let currentSection = this.dataUser.currentSection;
		await this.sendMessage({ text: this.subFlow[currentSection].word });
		this.changeFallback(true);
	}

	changeFallback(dataBolean) {
		this.statusFallBack = dataBolean;
	}

	addDataUser(data) {
		this.dataUser = data;
	}

	addFlow(data) {
		this.flow = data;
	}

	addSubFlow(data) {
		this.subFlow = data;
	}

	redirectToSubflow(nameSubFlow) {
		// this.subFlow = this.flow.subFlows[subFlow];
		// console.dir(this.flow, { depth: null });
		this.nameSubFlow = nameSubFlow;
		if (!this.subFlow) {
			throw new Error(
				`Subflow ${nameSubFlow} not found in flow ${this.flow.invo}`
			);
		}
	}
}

export { FunctionsFlow };
