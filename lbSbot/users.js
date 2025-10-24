const users = {
	987654321: {
		flowCurrent: '',
		currentSection: 0,
		nameSubFlow: '',
		isProcessing: false,
	},
};

function isProcessing(userId) {
	return users[userId]?.isProcessing;
}

const startProcessing = (userId) => {
	users[userId].isProcessing = true;
};

const stopProcessing = (userId) => {
	users[userId].isProcessing = false;
};

const saveCurretSection = (number, nameSubFlow, flowLength) => {
	let user = users[number];

	console.log(flowLength);
	if (user) {
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
		users[number] = { currentSection: 0, flowCurrent: '', nameSubFlow: '' };
	}
	// return users
};

const setNameSubFlow = (number, nameSubFlow) => {
	let user = users[number];
	if (user) {
		user.nameSubFlow = nameSubFlow;
	} else {
		// users[number] = { currentSection: 0, flowCurrent: '', nameSubFlow: nameSubFlow };
	}
};

const stableCurrent = (number) => {
	let user = users[number];

	if (user == undefined) {
		users[number] = { currentSection: 0, flowCurrent: '', nameSubFlow: '' };
	}
};

const getCurrent = (number) => {
	let user = users[number];
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
