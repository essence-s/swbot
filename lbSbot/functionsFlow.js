const mime = require('mime-types');
const fs = require('fs');
const { Readable } = require('stream');
const path = require('path');
const { url } = require('inspector');
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
		options = { reply: false, type: 'document', caption: '' },
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
		} else {
			messageContent = {
				document: fileSource,
				mimetype: mimeType,
				fileName: newFileName,
			};
		}

		await this.sock.sendMessage(this.remoteJid, messageContent, finalOptions);

		////////
		///////
		// const mimeType = mime.lookup(filePath);
		// const fileName = filePath.split('/').pop();

		// const toReadable = (buffer) => {
		// 	const readable = new Readable({ read: () => {} });
		// 	readable.push(buffer);
		// 	readable.push(null);
		// 	return readable;
		// };
		// const toBuffer = (streamd) => {
		// 	return new Promise((resolve) => {
		// 		const chunks = [];
		// 		// for await (const chunk of stream) {
		// 		// 	chunks.push(chunk);
		// 		// }
		// 		streamd().then((videoStream) => {
		// 			videoStream.on('data', (chunk) => {
		// 				chunks.push(chunk);
		// 				console.log('Recibido chunk de datos:', chunk.length);
		// 			});
		// 			videoStream.on('end', () => {
		// 				console.log('Stream finalizado.');

		// 				// videoStream.destroy();
		// 				resolve(Buffer.concat(chunks));
		// 			});
		// 		});
		// 	});
		// };

		// toBuffer(filePath)
		// 	.then(async (fileBuffer) => {
		// 		console.log('llgo toBuffer');
		// 		await this.sock.sendMessage(this.remoteJid, {
		// 			document: { stream: fileBuffer },
		// 			mimetype: 'video/mp4',
		// 			fileName: 'dinuo.mp4',
		// 		});
		// 	})
		// 	.catch((error) => {
		// 		console.error('Error al convertir el stream a buffer:', error);
		// 	});

		// async function* asyncIterable(stream) {
		// 	for await (const chunk of stream) {
		// 		yield chunk;
		// 	}
		// }

		// const asyncIterableStream = toAsyncIterator(filePath);

		// let fileBuffer = await toBuffer(filePath);
		// filePath().then(async (videoStream) => {
		// 	await this.sock.sendMessage(this.remoteJid, {
		// 		// video: { stream: await toBuffer(filePath) },
		// 		document: { stream: videoStream },
		// 		// document: { stream: fileBuffer },
		// 		// document: fileBuffer,
		// 		mimetype: 'video/mp4',
		// 		fileName: 'dinuo.mp4',
		// 	});
		// });
		////////
		///////
		// console.log(' llego a sendFile');
		// filePath().then(async (videoStream) => {
		// 	// const fileBuffer = fs.readFileSync('./checkFolder/videogarden.mp4');
		// 	console.log(' llgo then');
		// 	console.log('videoStream', videoStream);
		// 	// console.log(fileBuffer);
		// 	await this.sock.sendMessage(this.remoteJid, {
		// 		// video: { stream: await toBuffer(filePath) },
		// 		document: { stream: videoStream },
		// 		// document: { stream: fileBuffer },
		// 		// document: fileBuffer,
		// 		mimetype: 'video/mp4',
		// 		fileName: 'dinuo.mp4',
		// 	});
		// });
		//////

		// await this.sock.sendMessage(this.remoteJid, {
		//     document: { url: filePath },
		//     mimetype: mimeType,
		//     fileName: fileName,
		// })
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

module.exports = { FunctionsFlow };
