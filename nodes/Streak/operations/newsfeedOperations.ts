import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { validateParameters, fetchAllResults, getPageParameter, handlePagination } from './utils';

/**
 * Newsfeed endpoints page by `page` and `limit`, newest events first. Without either, one request
 * returns everything Streak keeps for the feed, so Return All makes that single request.
 */
async function getNewsfeed(
	this: IExecuteFunctions,
	itemIndex: number,
	endpoint: string,
	detailLevel: string,
): Promise<IDataObject | IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

	if (returnAll) {
		return await fetchAllResults(this, endpoint, { detailLevel });
	}

	const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
	const page = getPageParameter.call(this, itemIndex);

	return await handlePagination(this, endpoint, false, limit, { detailLevel }, 'v1', page);
}

/**
 * Handle newsfeed-related operations for the Streak API
 */
export async function handleNewsfeedOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'getPipelineNewsfeed') {
		const pipelineKey = this.getNodeParameter('pipelineKey', itemIndex) as string;
		const detailLevel = this.getNodeParameter('detailLevel', itemIndex, 'ALL') as string;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		return await getNewsfeed.call(this, itemIndex, `/pipelines/${pipelineKey}/newsfeed`, detailLevel);
	} else if (operation === 'getBoxNewsfeed') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const detailLevel = this.getNodeParameter('detailLevel', itemIndex, 'ALL') as string;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await getNewsfeed.call(this, itemIndex, `/boxes/${boxKey}/newsfeed`, detailLevel);
	} else if (operation === 'getAllNewsfeed') {
		const detailLevel = this.getNodeParameter('detailLevel', itemIndex, 'ALL') as string;

		return await getNewsfeed.call(this, itemIndex, '/newsfeed', detailLevel);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The newsfeed operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
