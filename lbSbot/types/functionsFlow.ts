export type SendMessage = (args: {
	text: string;
	options?: { reply?: boolean };
}) => Promise<any>;

export type DeleteMessage = (args: { key: any }) => Promise<any>;

export type RedirectToSubflow = (name: string) => void;

export type FallBack = () => Promise<void>;
export type UpdateMessage = (args: { text: string; key: any }) => Promise<any>;
export type EndFlow = (args: { text: string }) => Promise<void>;

export type SendFile = (args: {
	filePath: string | { url: string };
	fileName?: string;
	options?: {
		reply?: boolean;
		type?: string;
		caption?: string;
		ptt?: boolean;
	};
}) => Promise<any>;

export type SendSticker = (args: {
	filePath: string;
	options?: { reply?: boolean };
}) => Promise<any>;
