let dataSaveArray = [];

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

const saveData = (identif, dataFuction) => {
	let indice = dataSaveArray.findIndex((d) => d.pushName == identif);
	if (indice !== -1) {
		dataSaveArray[indice] = dataFuction(dataSaveArray[indice]);
	} else {
		dataSaveArray.push(dataFuction({}));
	}
};
const converNumberToURL = (idName, dataOptions) => {
	let url = dataSaveArray.find((d) => d.pushName == idName)?.dataSaveSearch[
		dataOptions.option - 1
	]?.videoId;
	return url;
};
const addSeletedVideoInfo = (idName, index) => {
	let element = dataSaveArray.find((d) => d.pushName == idName);
	let elementSelected = element?.dataSaveSearch[index];
	element.selectedVideoInfo = elementSelected;
};
const dataToAdd = (idName, dataOptions) => {
	let element = dataSaveArray.find((d) => d.pushName == idName);
	element.dataOptions = dataOptions;
};

const currentStatus = (idName, data) => {
	let ds = dataSaveArray.find((d) => d.pushName == idName);
	ds.status = data;
};

const getStatus = (idName) => {
	return dataSaveArray.find((d) => d.pushName == idName)?.status;
};

const getDataUser = (idName) => {
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
