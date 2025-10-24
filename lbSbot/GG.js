// const {
// 	default: makeWASocket,
// 	DisconnectReason,
// 	useMultiFileAuthState,
// } = require('@whiskeysockets/baileys');
import { makeWASocket, DisconnectReason, useMultiFileAuthState } from 'baileys';

import qrcode from 'qrcode-terminal';

import { Boom } from '@hapi/boom';
import pino from 'pino';
const log = pino;

import { FunctionsFlow } from './functionsFlow.js';
import {
	getCurrent,
	saveCurretSection,
	stableCurrent,
	setNameSubFlow,
	startProcessing,
	stopProcessing,
	isProcessing,
} from './users.js';

class Connectbaileys {
	vendor;
	constructor(dataFlows) {
		this.dataFlows = dataFlows;
	}

	initBailey = async () => {
		const { state, saveCreds } = await useMultiFileAuthState('bot_sessions');
		const sock = makeWASocket({
			// can provide additional config here
			// printQRInTerminal: true,
			version: [2, 3000, 1025190524],
			auth: state,
			logger: log({ level: 'silent' }),
		});
		// sock.sendMessage('ds',{document:'',fileName,mimetype})
		sock.ev.on('connection.update', async (update) => {
			const { connection, lastDisconnect, qr } = update;

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

	initSo(sock) {
		this.vendor = sock;
		this.vendor.ev.on('messages.upsert', async (m) => {
			// console.log(m.messages);

			// comment
			if (m.messages[0]?.key.fromMe) return;

			let remoteJid = m.messages[0].key.remoteJid;
			let numberT = remoteJid.split('@')[0];

			if (isProcessing(numberT))
				return await this.vendor.sendMessage(remoteJid, {
					text: 'Ya hay algo en proceso, espere un momento',
				});
			// let msg = m.messages[0]
			let message;
			let otherMe1 = m.messages[0].message?.conversation;
			let otherMe2 = m.messages[0].message?.extendedTextMessage?.text;

			// console.log({ message: m.messages[0].message });
			if (otherMe1) {
				message = otherMe1;
			} else if (otherMe2) {
				message = otherMe2;
			} else {
				// await this.vendor.sendMessage(remoteJid, {
				// 	text: 'error intente de nuevo',
				// });
				console.log('message not found');
				return;
			}

			// if (message.includes('$$')) {
			// 	message = message.replace(/\s?\$\$/, '');
			// } else {
			// 	return;
			// } //solo desarrollo

			// console.log(m.messages[0].message);
			// console.dir(m, { depth: null });

			stableCurrent(numberT);
			let flowCurrent9 = getCurrent(numberT);

			this.dataFlows.forEach(async (flow) => {
				startProcessing(numberT);

				// si en el flujo del usuario esta activo una invocacion
				if (flow.invo == flowCurrent9.flowCurrent) {
					const nameSubFlow = flowCurrent9.nameSubFlow;
					const subFlow = flow.subFlows[nameSubFlow];
					let functionsFlow = new FunctionsFlow(
						this.vendor,
						remoteJid,
						m.messages[0]
					);
					functionsFlow.addDataUser(flowCurrent9);
					functionsFlow.addFlow(flow);
					functionsFlow.addSubFlow(subFlow);

					m.messages[0].message.conversation = message;
					console.log({ namesubflow: flowCurrent9.nameSubFlow });
					await LL(
						numberT,
						subFlow,
						m,
						functionsFlow,
						flowCurrent9.nameSubFlow
					);
					// console.log('1', users)
				} else {
					// verificar si el mensaje tiene en invo, y despues ejecutar la funcion del invo si esta definida
					if (message.includes(flow.invo)) {
						// guardamos en comando que se uso en el mismo usuario
						// console.log('2', users)
						flowCurrent9.flowCurrent = flow.invo;

						m.messages[0].message.conversation = message;
						let functionsFlow2 = new FunctionsFlow(
							this.vendor,
							remoteJid,
							m.messages[0]
						);
						let nameSubFlow = await LL2(flow, m, functionsFlow2);
						console.log(nameSubFlow);
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
						} else {
							let functionsFlow = new FunctionsFlow(
								this.vendor,
								remoteJid,
								m.messages[0]
							);
							functionsFlow.addDataUser(flowCurrent9);
							functionsFlow.addFlow(flow);
							functionsFlow.addSubFlow(newSubFlow);
							await LL(numberT, newSubFlow, m, functionsFlow, nameSubFlow);
						}
					}
				}

				stopProcessing(numberT);
			});
		});
	}
}

const LL = async (numberT, newSubFlow, m, functionsFlow, nameSubFlow) => {
	let sectionFunction = getCurrent(numberT).currentSection;

	await newSubFlow[sectionFunction].action({
		ctx: m,
		sendMessage: (...args) => functionsFlow.sendMessage(...args),
		sendFile: (...args) => functionsFlow.sendFile(...args),
		endFlow: (...args) => functionsFlow.endFlow(...args),
		fallBack: () => functionsFlow.fallBack(),

		deleteMessage: (...args) => functionsFlow.deleteMessage(...args),
		updateMessage: (...args) => functionsFlow.updateMessage(...args),
		sendSticker: (...args) => functionsFlow.sendSticker(...args),
	});
	if (!functionsFlow.statusFallBack) {
		if (sectionFunction + 1 < newSubFlow.length) {
			if (newSubFlow[sectionFunction + 1].word) {
				await functionsFlow.sendMessage({
					text: newSubFlow[sectionFunction + 1].word,
				});
				saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
			} else {
				saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
				await LL(numberT, newSubFlow, m, functionsFlow, nameSubFlow);
			}

			// await functionsFlow.sendMessage(newSubFlow[sectionFunction + 1].word);
		} else {
			saveCurretSection(numberT, nameSubFlow, newSubFlow.length);
			// await functionsFlow.endFlow('Fin del flujo');
		}
	}
};

const LL2 = async (flow, m, functionsFlow) => {
	if (!flow.onImmediateExecute) return;
	await flow.onImmediateExecute({
		ctx: m,
		sendMessage: (...args) => functionsFlow.sendMessage(...args),
		sendFile: (...args) => functionsFlow.sendFile(...args),
		endFlow: (...args) => functionsFlow.endFlow(...args),
		fallBack: () => functionsFlow.fallBack(),
		redirectToSubflow: (subFlow) => functionsFlow.redirectToSubflow(subFlow),
	});

	return functionsFlow.nameSubFlow;
};

export { Connectbaileys };
