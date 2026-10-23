import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { streakApiRequest, streakApiFormRequest, validateParameters, fetchAllResults } from './utils';

/**
 * Handle thread-related operations for the Streak API
 */
export async function handleThreadOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listThreadsInBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await fetchAllResults(this, `/boxes/${boxKey}/threads`);
	} else if (operation === 'getThread') {
		const threadKey = this.getNodeParameter('threadKey', itemIndex) as string;

		validateParameters.call(this, { threadKey }, ['threadKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/threads/${threadKey}`);
	} else if (operation === 'getThreadByGmailId') {
		const hexGmailThreadId = this.getNodeParameter('hexGmailThreadId', itemIndex) as string;

		validateParameters.call(this, { hexGmailThreadId }, ['hexGmailThreadId'], itemIndex);

		// Undocumented endpoint that uses POST for a read operation.
		// Only works when the authenticated user owns the email thread.
		return await streakApiRequest(
			this,
			'POST',
			'/threadinfo/',
			undefined,
			{ hexGmailThreadId },
		);
	} else if (operation === 'addThreadToBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const threadGmailId = this.getNodeParameter('threadGmailId', itemIndex) as string;

		validateParameters.call(
			this,
			{ boxKey, threadGmailId },
			['boxKey', 'threadGmailId'],
			itemIndex,
		);

		return await streakApiFormRequest(
			this,
			'PUT',
			`/boxes/${boxKey}/threads`,
			{ boxKey, threadGmailId },
		);
	} else if (operation === 'removeThread') {
		const threadKey = this.getNodeParameter('threadKey', itemIndex) as string;

		validateParameters.call(this, { threadKey }, ['threadKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/threads/${threadKey}`);

		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Thread removed successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The thread operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
