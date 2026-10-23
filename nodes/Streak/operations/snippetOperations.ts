import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import { streakApiRequest, streakApiFormRequest, validateParameters, fetchAllResults } from './utils';

/**
 * Handle snippet-related operations for the Streak API
 */
export async function handleSnippetOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listSnippets') {
		return await fetchAllResults(this, '/snippets');
	} else if (operation === 'getSnippet') {
		const snippetKey = this.getNodeParameter('snippetKey', itemIndex) as string;

		validateParameters.call(this, { snippetKey }, ['snippetKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/snippets/${snippetKey}`);
	} else if (operation === 'createSnippet') {
		const snippetName = this.getNodeParameter('snippetName', itemIndex) as string;
		const snippetBody = this.getNodeParameter('snippetBody', itemIndex) as string;

		validateParameters.call(
			this,
			{ snippetName, snippetBody },
			['snippetName', 'snippetBody'],
			itemIndex,
		);

		return await streakApiFormRequest(
			this,
			'PUT',
			'/snippets',
			{ snippetName, snippetText: snippetBody },
		);
	} else if (operation === 'editSnippet') {
		const snippetKey = this.getNodeParameter('snippetKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { snippetKey }, ['snippetKey'], itemIndex);

		if (Object.keys(updateFields).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		if (updateFields.snippetName !== undefined) {
			body.snippetName = updateFields.snippetName;
		}

		if (updateFields.snippetBody !== undefined) {
			body.snippetText = updateFields.snippetBody;
		}

		return await streakApiRequest(this, 'POST', `/snippets/${snippetKey}`, body);
	} else if (operation === 'deleteSnippet') {
		const snippetKey = this.getNodeParameter('snippetKey', itemIndex) as string;

		validateParameters.call(this, { snippetKey }, ['snippetKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/snippets/${snippetKey}`);

		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Snippet deleted successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The snippet operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
