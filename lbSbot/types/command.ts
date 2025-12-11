import type {
	EndFlow,
	FallBack,
	RedirectToSubflow,
	SendFile,
	SendMessage,
	SendSticker,
	UpdateMessage,
} from './functionsFlow.ts';

export interface CommandContext {
	msg: any;
	messages: any[];
	data: any;
}
export interface ExecuteParams {
	ctx: CommandContext;
	sendMessage: SendMessage;
	redirectToSubflow: RedirectToSubflow;
	fallBack: FallBack;
	updateMessage: UpdateMessage;
	endFlow: EndFlow;
	sendFile: SendFile;
	sendSticker: SendSticker;
}

export type CommandAction = (params: ExecuteParams) => any | Promise<any>;

export interface SubFlowStep {
	word?: string;
	action: CommandAction;
}

export type SubFlows = Record<string, SubFlowStep[]>;

export interface Command {
	invo: string;
	shortDescription: string;
	description: string;
	onImmediateExecute: CommandAction;
	defaultSubFlow?: string;
	subFlows?: SubFlows;
}
