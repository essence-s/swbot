import type { BaileysEventMap, WASocket } from 'baileys';
import { DisconnectReason, makeWASocket, useMultiFileAuthState } from 'baileys';

import qrcode from 'qrcode-terminal';

import { Boom } from '@hapi/boom';
import pino from 'pino';
const log = pino;

import { FunctionsFlow } from './functionsFlow.ts';
import type { Command, SubFlowStep } from './types/command.ts';
import type { User } from './users.ts';
import {
	getCurrent,
	isProcessing,
	saveCurretSection,
	setNameSubFlow,
	stableCurrent,
	startProcessing,
	stopProcessing,
} from './users.ts';

class Connectbaileys {
	vendor: any;
	dataFlows: Command[];
	constructor(dataFlows: Command[]) {
		this.dataFlows = dataFlows;
	}

	initBailey = async () => {
		const { state, saveCreds } = await useMultiFileAuthState('bot_sessions');
		const sock: WASocket = makeWASocket({
			// can provide additional config here
			// printQRInTerminal: true,
			// version: [2, 3000, 1025190524],
      version: [2, 3000, 1033893291],
			auth: state,
			logger: log({ level: 'silent' }),
		});
		// sock.sendMessage('ds',{document:'',fileName,mimetype})
		sock.ev.on('connection.update', async (update) => {
			const { connection, lastDisconnect = { error: '' }, qr } = update;

			if (qr) {
				console.log('qr');
				qrcode.generate(qr, { small: true });
			}

			if (connection === 'close') {
				const shouldReconnect =
					new Boom(lastDisconnect.error)?.output?.statusCode !==
					DisconnectReason.loggedOut;
				// console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
				console.log('connection closed ,reconnecting w');
				// reconnect if not logged out
				if (shouldReconnect) {
					setTimeout(() => {
						this.initBailey();
					}, 5000);
				}
			} else if (connection === 'open') {
				console.log('opened connection w');
				this.initSo(sock);
			}
		});

		sock.ev.on('creds.update', saveCreds);
	};

	initSo(sock: WASocket) {
		this.vendor = sock;
		this.vendor.ev.on(
			'messages.upsert',
			async (m: BaileysEventMap['messages.upsert']) => {
				// console.log('mensajitos');
				// console.dir(m.messages, { depth: null });
				// console.dir(m, { depth: null });

				const messageObject = m.messages[0];

				// comment
				// if (messageObject?.key.fromMe) return console.log('no entra');
				if (!messageObject?.key.participant && messageObject?.key.fromMe)
					return console.log('no entra');

				// el remoteJid es el identificador para enviar mensajes , un grupo tiene uno y un chat personal tambien, es unico
				let remoteJid = messageObject.key.remoteJid;
				if (!remoteJid) return console.log('no tiene remoteJid');
				// En grupos, el remitente real está en `key.participant`.
				// Si no existe, es un chat individual y usamos `remoteJid`.
				let participant = messageObject.key.participant || remoteJid;

				let numberT = participant.split('@')[0];
				console.log('sender (numberT):', numberT);
				console.log('is processing: ' + isProcessing(numberT));

				if (isProcessing(numberT)) return;
				// return await this.vendor.sendMessage(remoteJid, {
				// 	text: 'Ya hay algo en proceso, espere un momento',
				// });

				const messageText = extractText(messageObject);
				if (!messageText) return console.log('message not found');

				if (!messageObject.message) return;
				messageObject.message.conversation = messageText;
				// console.log({ message: messageObject.message });

				// if (message.includes('$$')) {
				// 	message = message.replace(/\s?\$\$/, '');
				// } else {
				// 	return;
				// } //solo desarrollo

				// console.log(messageObject.message);
				// console.dir(m, { depth: null });

				stableCurrent(numberT);
				let flowCurrent9 = getCurrent(numberT);

				this.dataFlows.forEach(async (flow) => {
					// si en el flujo del usuario esta activo una invocacion
					if (flow.invo == flowCurrent9.flowCurrent) {
						startProcessing(numberT);

						const nameSubFlow = flowCurrent9.nameSubFlow;
						if (flow.subFlows == undefined)
							return console.log('subFlows undefined');
						const subFlow = flow.subFlows[nameSubFlow];

						let functionsFlow = new FunctionsFlow(
							this.vendor,
							remoteJid,
							messageObject
						);
						functionsFlow.addDataUser(flowCurrent9);
						functionsFlow.addFlow(flow);
						functionsFlow.addSubFlow(subFlow);

						console.log({ namesubflow: flowCurrent9.nameSubFlow });
						await handleSubflow(
							numberT,
							subFlow,
							m,
							functionsFlow,
							flowCurrent9.nameSubFlow,
							messageText
						);
						// console.log('1', users)
						stopProcessing(numberT);
					} else {
						// verificar si el mensaje tiene en invo, y despues ejecutar la funcion del invo si esta definida
						if (messageText.includes(flow.invo)) {
							startProcessing(numberT);

							// guardamos en comando que se uso en el mismo usuario
							// console.log('2', users)
							flowCurrent9.flowCurrent = flow.invo;

							let functionsFlow2 = new FunctionsFlow(
								this.vendor,
								remoteJid,
								messageObject
							);
							let nameSubFlow = await handleImmediateExecution(
								flow,
								m,
								functionsFlow2,
								messageText,
								flowCurrent9
							);
							console.log(nameSubFlow);

							if (!nameSubFlow) {
								return stopProcessing(numberT);
							}

							if (flow.subFlows == undefined)
								return console.log('subFlows undefined');

							let newSubFlow = flow.subFlows[nameSubFlow];

							let sectionFunction = flowCurrent9.currentSection;
							// console.log(newSubFlow);
							console.log({ sectionFunction });
							// console.log(newSubFlow[sectionFunction].word);
							if (newSubFlow[sectionFunction].word) {
								await this.vendor.sendMessage(remoteJid, {
									text: newSubFlow[sectionFunction].word,
								});
								setNameSubFlow(numberT, nameSubFlow);
								stopProcessing(numberT);
							} else {
								let functionsFlow = new FunctionsFlow(
									this.vendor,
									remoteJid,
									messageObject
								);
								functionsFlow.addDataUser(flowCurrent9);
								functionsFlow.addFlow(flow);
								functionsFlow.addSubFlow(newSubFlow);
								await handleSubflow(
									numberT,
									newSubFlow,
									m,
									functionsFlow,
									nameSubFlow,
									messageText
								);
								stopProcessing(numberT);
							}
						}
					}
				});
			}
		);
	}
}

const handleSubflow = async (
	numberT: string,
	newSubFlow: SubFlowStep[],
	m: BaileysEventMap['messages.upsert'],
	functionsFlow: FunctionsFlow,
	nameSubFlow: string,
	messageText: string
) => {
	let user = getCurrent(numberT);
	let sectionFunction = user.currentSection;
	user.data = user.data || {};

	await newSubFlow[sectionFunction].action({
		ctx: m,
		messageText: messageText,
		data: user.data,
		sendMessage: (...args) => functionsFlow.sendMessage(...args),
		sendFile: (...args) => functionsFlow.sendFile(...args),
		endFlow: (...args) => functionsFlow.endFlow(...args),
		fallBack: () => functionsFlow.fallBack(),

		deleteMessage: (...args) => functionsFlow.deleteMessage(...args),
		updateMessage: (...args) => functionsFlow.updateMessage(...args),
		sendSticker: (...args) => functionsFlow.sendSticker(...args),
		redirectToSubflow: (subFlow) => functionsFlow.redirectToSubflow(subFlow),
	});
	if (!functionsFlow.statusFallBack) {
		if (sectionFunction + 1 < newSubFlow.length) {
			let word = newSubFlow[sectionFunction + 1].word;
			if (word) {
				await functionsFlow.sendMessage({
					text: word,
				});
				saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
			} else {
				saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
				await handleSubflow(
					numberT,
					newSubFlow,
					m,
					functionsFlow,
					nameSubFlow,
					messageText
				);
			}

			// await functionsFlow.sendMessage(newSubFlow[sectionFunction + 1].word);
		} else {
			saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
			// await functionsFlow.endFlow('Fin del flujo');
		}
	}
};

const handleImmediateExecution = async (
	flow: Command,
	m: BaileysEventMap['messages.upsert'],
	functionsFlow: FunctionsFlow,
	messageText: string,
	user: User
) => {
	if (!flow.onImmediateExecute) return;
	user.data = user.data || {};
	await flow.onImmediateExecute({
		ctx: m,
		messageText: messageText,
		data: user.data,

		sendMessage: (...args) => functionsFlow.sendMessage(...args),
		sendFile: (...args) => functionsFlow.sendFile(...args),
		endFlow: (...args) => functionsFlow.endFlow(...args),
		fallBack: () => functionsFlow.fallBack(),

		deleteMessage: (...args) => functionsFlow.deleteMessage(...args),
		updateMessage: (...args) => functionsFlow.updateMessage(...args),
		sendSticker: (...args) => functionsFlow.sendSticker(...args),
		redirectToSubflow: (subFlow) => functionsFlow.redirectToSubflow(subFlow),
	});

	if (functionsFlow.nameSubFlow) return functionsFlow.nameSubFlow;
	if (!flow.subFlows) return console.log('no subFlow');
	console.log('el default', Object.keys(flow.subFlows)[0]);
	return flow.defaultSubFlow ?? Object.keys(flow.subFlows)[0] ?? null;
};

const extractText = (msg: any): string | null => {
	return msg?.message?.conversation || msg?.message?.extendedTextMessage?.text;
};

export { Connectbaileys };
