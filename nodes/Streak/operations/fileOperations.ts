import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import {
	streakApiRequest,
	validateParameters,
	fetchAllResults,
	getPageParameter,
	handlePagination,
	parseKeyList,
} from './utils';

/**
 * Handle file-related operations for the Streak API
 */
export async function handleFileOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listFilesInBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		const endpoint = `/boxes/${boxKey}/files`;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

		// Without page or limit, Streak returns every file in one response
		if (returnAll) {
			return await fetchAllResults(this, endpoint, undefined, 'v1');
		}

		// v1 accepts page and limit, but its response is a bare array with no hasNextPage
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const page = getPageParameter.call(this, itemIndex);

		return await handlePagination(this, endpoint, false, limit, {}, 'v1', page);
	} else if (operation === 'getFile') {
		const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

		validateParameters.call(this, { fileKey }, ['fileKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/files/${fileKey}`, undefined, undefined, 'v1');
	} else if (operation === 'addFileToBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const driveFileIds = parseKeyList(this.getNodeParameter('driveFileId', itemIndex));

		validateParameters.call(
			this,
			{ boxKey, driveFileId: driveFileIds.join(',') },
			['boxKey', 'driveFileId'],
			itemIndex,
		);

		// Streak takes an array with one entry per file, even for a single file;
		// a bare object makes it return HTTP 500. Every entry names the same box.
		return await streakApiRequest(
			this,
			'POST',
			'/files/',
			driveFileIds.map((driveFileId) => ({ driveFileId, driveBoxKey: boxKey })),
			undefined,
			'v2',
		);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The file operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
