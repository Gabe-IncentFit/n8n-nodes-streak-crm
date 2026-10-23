import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters, fetchAllResults } from './utils';

/**
 * Read Drive file IDs from text separated by commas or new lines, or from an array
 * passed in by an expression. Blank entries and repeats are dropped.
 */
function parseDriveFileIds(value: unknown): string[] {
	const parts = Array.isArray(value) ? value : String(value ?? '').split(/[\s,]+/);
	const ids: string[] = [];

	for (const part of parts) {
		const id = String(part ?? '').trim();
		if (id && !ids.includes(id)) {
			ids.push(id);
		}
	}

	return ids;
}

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

		return await fetchAllResults(this, `/boxes/${boxKey}/files`, undefined, 'v1');
	} else if (operation === 'getFile') {
		const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;

		validateParameters.call(this, { fileKey }, ['fileKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/files/${fileKey}`, undefined, undefined, 'v1');
	} else if (operation === 'addFileToBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const driveFileIds = parseDriveFileIds(this.getNodeParameter('driveFileId', itemIndex));

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
