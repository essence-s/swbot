type DATA_SAVE = {
	pushName: string;
	dataSaveSearch: { videoId: string; title: string; imgVideo: string }[];
	dataQualitys: any;
	dataOptions: any;
	selectedVideoInfo: {
		videoId: string;
		title: string;
		imgVideo: string;
	};
	status: any;
};
let dataSaveArray: DATA_SAVE[] = [];

const saveData = (idName: string, dataFuction: any) => {
	let indice = dataSaveArray.findIndex((d) => d.pushName == idName);
	if (indice !== -1) {
		dataSaveArray[indice] = dataFuction(dataSaveArray[indice]);
	} else {
		dataSaveArray.push(dataFuction({}));
	}
};
const converNumberToURL = (idName: string, dataOptions: { option: number }) => {
	let url = dataSaveArray.find((d) => d.pushName == idName)?.dataSaveSearch[
		dataOptions.option - 1
	]?.videoId;
	return url;
};
const addSeletedVideoInfo = (idName: string, index: number) => {
	let element = dataSaveArray.find((d) => d.pushName == idName);
	if (!element) return;
	let elementSelected = element?.dataSaveSearch[index];
	element.selectedVideoInfo = elementSelected;
};
const dataToAdd = (idName: string, dataOptions: { option: number }) => {
	let element = dataSaveArray.find((d) => d.pushName == idName);
	if (!element) return;
	element.dataOptions = dataOptions;
};

const currentStatus = (idName: string, data: {}) => {
	let ds = dataSaveArray.find((d) => d.pushName == idName);
	if (!ds) return;
	ds.status = data;
};

const getStatus = (idName: string) => {
	return dataSaveArray.find((d) => d.pushName == idName)?.status;
};

const getDataUser = (idName: string) => {
	return dataSaveArray.find((d) => d.pushName == idName);
};

export {
	saveData,
	converNumberToURL,
	currentStatus,
	getStatus,
	getDataUser,
	addSeletedVideoInfo,
};

// let pruebas = [
//     {
//         pushName: 'pushName',
//         dataSaveSearch: [
//             {
//                 videoId: `https://www.youtube.com/watch?v=${videoId}`,
//                 title,
//                 imgVideo
//             }, {}
//         ],
//         dataQualitys: {
//             videos: [
//                 {
//                     qualityLabel: 'qualityLabel',
//                     container: 'container',
//                     urlDnwl: 'url'
//                 }
//             ],
//             audios: [
//                 {
//                     container: 'container',
//                     urlDnwl: 'url'
//                 }
//             ]
//         },
//         dataOptions: {
//             option,
//             formato,
//             quality,
//             qualityN,

//         },
//         selectedVideoInfo: {
//             videoId: `https://www.youtube.com/watch?v=${videoId}`,
//             title,
//             imgVideo
//         }

//     },
//     {}
// ]
