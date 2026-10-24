import {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	JsonObject,
	NodeApiError,
} from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';

/**
 * Get File Contents. Streak answers with the file's raw bytes (for example `image/png`), not
 * JSON, so the file goes out as binary data, with its metadata as the item's JSON.
 */
export async function getFileContents(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData> {
	const fileKey = this.getNodeParameter('fileKey', itemIndex) as string;
	const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex, 'data') as string;

	validateParameters.call(this, { fileKey }, ['fileKey'], itemIndex);

	// The metadata carries the file's name and type
	const file = (await streakApiRequest(this, 'GET', `/files/${fileKey}`, undefined, undefined, 'v1')) as IDataObject;

	let response: { body: ArrayBuffer | Buffer; headers?: IDataObject };
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(this, 'streakApi', {
			method: 'GET',
			url: `https://api.streak.com/api/v1/files/${fileKey}/contents`,
			encoding: 'arraybuffer',
			returnFullResponse: true,
			json: false,
		})) as { body: ArrayBuffer | Buffer; headers?: IDataObject };
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}

	const contentType = String(response.headers?.['content-type'] ?? '').split(';')[0].trim();
	const mimeType = contentType || (file?.mimeType as string) || 'application/octet-stream';
	const fileName = (file?.fileName as string) || fileKey;

	const binary = await this.helpers.prepareBinaryData(Buffer.from(response.body as ArrayBuffer), fileName, mimeType);

	return { json: file, binary: { [binaryPropertyName]: binary } };
}
