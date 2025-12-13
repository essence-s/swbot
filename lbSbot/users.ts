export type User = {
	flowCurrent: string;
	currentSection: number;
	nameSubFlow: string;
	isProcessing?: boolean;
};

type UserId = string | number;

const users: Record<UserId, User> = {
	987654321: {
		flowCurrent: '',
		currentSection: 0,
		nameSubFlow: '',
		isProcessing: false,
	},
};

function isProcessing(userId: string) {
	return users[userId]?.isProcessing;
}

const startProcessing = (userId: string) => {
	users[userId].isProcessing = true;
};

const stopProcessing = (userId: string) => {
	users[userId].isProcessing = false;
};

const saveCurretSection = (
	userId: string,
	nameSubFlow: string,
	flowLength: number
) => {
	let user = users[userId];

	console.log(flowLength);
	if (user && user.currentSection !== undefined) {
		console.log(user.currentSection >= flowLength - 1);
		if (user.currentSection >= flowLength - 1) {
			user.currentSection = 0;
			user.flowCurrent = '';
			user.nameSubFlow = '';
			return;
		}
		user.currentSection = user.currentSection + 1;
		user.nameSubFlow = nameSubFlow;
	} else {
		users[userId] = { currentSection: 0, flowCurrent: '', nameSubFlow: '' };
	}
	// return users
};

const setNameSubFlow = (userId: string, nameSubFlow: string) => {
	let user = users[userId];
	if (user) {
		user.nameSubFlow = nameSubFlow;
	} else {
		// users[number] = { currentSection: 0, flowCurrent: '', nameSubFlow: nameSubFlow };
	}
};

const stableCurrent = (userId: string) => {
	let user = users[userId];

	if (!user) {
		users[userId] = { currentSection: 0, flowCurrent: '', nameSubFlow: '' };
	}
};

const getCurrent = (userId: string) => {
	let user = users[userId];
	return user;
};

export {
	isProcessing,
	startProcessing,
	stopProcessing,
	saveCurretSection,
	stableCurrent,
	getCurrent,
	setNameSubFlow,
};
