import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters, fetchAllResults } from './utils';

/**
 * Handle comment-related operations for the Streak API
 */
export async function handleCommentOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listCommentsInBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		// v2 returns { hasNextPage, results } and takes no paging params
		return await fetchAllResults(this, `/boxes/${boxKey}/comments`);
	} else if (operation === 'getComment') {
		const commentKey = this.getNodeParameter('commentKey', itemIndex) as string;

		validateParameters.call(this, { commentKey }, ['commentKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/comments/${commentKey}`);
	} else if (operation === 'createComment') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const message = this.getNodeParameter('message', itemIndex) as string;

		validateParameters.call(this, { boxKey, message }, ['boxKey', 'message'], itemIndex);

		return await streakApiRequest(this, 'POST', `/boxes/${boxKey}/comments`, { message });
	} else if (operation === 'editComment') {
		const commentKey = this.getNodeParameter('commentKey', itemIndex) as string;
		const message = this.getNodeParameter('message', itemIndex) as string;

		validateParameters.call(this, { commentKey, message }, ['commentKey', 'message'], itemIndex);

		return await streakApiRequest(this, 'POST', `/comments/${commentKey}`, { message });
	} else if (operation === 'deleteComment') {
		const commentKey = this.getNodeParameter('commentKey', itemIndex) as string;

		validateParameters.call(this, { commentKey }, ['commentKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/comments/${commentKey}`);

		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Comment deleted successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The comment operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
