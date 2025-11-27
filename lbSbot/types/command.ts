export interface CommandContext {
	msg: any;
	messages: any[];
}

export interface ExecuteParams {
	ctx: CommandContext;
	sendMessage: (args: {
		text: string;
		options?: { reply?: boolean };
	}) => Promise<any>;
	redirectToSubflow: (name: string) => void;

	fallBack: () => Promise<void>;
	updateMessage: (args: { text: string; key: any }) => Promise<any>;
	endFlow: (args: { text: string }) => Promise<void>;

	sendFile?: (args: {
		filePath: string | { url: string };
		fileName?: string;
		options?: { reply?: boolean; type?: string; caption?: string };
	}) => Promise<any>;

	sendSticker?: (args: {
		filePath: string;
		options?: { reply?: boolean };
	}) => Promise<any>;
}

export type CommandAction = (params: ExecuteParams) => Promise<void>;

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
