import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters, handlePagination } from './utils';

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
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await handlePagination(
			this,
			`/boxes/${boxKey}/files`,
			returnAll,
			returnAll ? 100 : limit,
			{},
			'v1',
		);
	} else if (operation === 'getFile') {
		const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

		validateParameters.call(this, { fileKey }, ['fileKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/files/${fileKey}`, undefined, undefined, 'v1');
	} else if (operation === 'getFileContents') {
		const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

		validateParameters.call(this, { fileKey }, ['fileKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/files/${fileKey}/contents`, undefined, undefined, 'v1');
	} else if (operation === 'addFileToBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const driveFileId = this.getNodeParameter('driveFileId', itemIndex) as string;

		validateParameters.call(
			this,
			{ boxKey, driveFileId },
			['boxKey', 'driveFileId'],
			itemIndex,
		);

		return await streakApiRequest(
			this,
			'POST',
			'/files/',
			[{ driveFileId, driveBoxKey: boxKey }],
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
