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
} from './users.ts';

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
			// version: [2, 3000, 1025190524],
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
			// console.log('mensajitos');
			// console.dir(m.messages, { depth: null });
			// console.dir(m, { depth: null });

			// comment
			// if (m.messages[0]?.key.fromMe) return console.log('no entra');
			if (!m.messages[0]?.key.participant && m.messages[0]?.key.fromMe)
				return console.log('no entra');

			let remoteJid = m.messages[0].key.remoteJid;
			// En grupos, el remitente real está en `key.participant`.
			// Si no existe, es un chat individual y usamos `remoteJid`.
			let participant = m.messages[0].key.participant || remoteJid;
			let numberT = (participant || remoteJid).split('@')[0];
			console.log('sender (numberT):', numberT);
			console.log('is processing: ' + isProcessing(numberT));

			if (isProcessing(numberT)) return;
			// return await this.vendor.sendMessage(remoteJid, {
			// 	text: 'Ya hay algo en proceso, espere un momento',
			// });
			// let msg = m.messages[0]

			let otherMe1 = m.messages[0].message?.conversation;
			let otherMe2 = m.messages[0].message?.extendedTextMessage?.text;
			let message = otherMe1 || otherMe2;
			if (!message) return console.log('message not found');
			// console.log({ message: m.messages[0].message });

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
				// si en el flujo del usuario esta activo una invocacion
				if (flow.invo == flowCurrent9.flowCurrent) {
					startProcessing(numberT);

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
					stopProcessing(numberT);
				} else {
					// verificar si el mensaje tiene en invo, y despues ejecutar la funcion del invo si esta definida
					if (message.includes(flow.invo)) {
						startProcessing(numberT);

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

						if (!nameSubFlow) {
							return stopProcessing(numberT);
						}

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
								m.messages[0]
							);
							functionsFlow.addDataUser(flowCurrent9);
							functionsFlow.addFlow(flow);
							functionsFlow.addSubFlow(newSubFlow);
							await LL(numberT, newSubFlow, m, functionsFlow, nameSubFlow);
							stopProcessing(numberT);
						}
					}
				}
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

	if (functionsFlow.nameSubFlow) return functionsFlow.nameSubFlow;
	console.log('el default', Object.keys(flow.subFlows)[0]);
	return flow.defaultSubFlow ?? Object.keys(flow.subFlows)[0] ?? null;
};

export { Connectbaileys };
