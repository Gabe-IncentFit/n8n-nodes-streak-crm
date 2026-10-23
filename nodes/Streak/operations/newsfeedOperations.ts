import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { validateParameters, fetchAllResults } from './utils';

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

		return await fetchAllResults(this, `/pipelines/${pipelineKey}/newsfeed`, { detailLevel });
	} else if (operation === 'getBoxNewsfeed') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const detailLevel = this.getNodeParameter('detailLevel', itemIndex, 'ALL') as string;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await fetchAllResults(this, `/boxes/${boxKey}/newsfeed`, { detailLevel });
	} else if (operation === 'getAllNewsfeed') {
		const detailLevel = this.getNodeParameter('detailLevel', itemIndex, 'ALL') as string;

		return await fetchAllResults(this, '/newsfeed', { detailLevel });
	}

	throw new NodeOperationError(
		this.getNode(),
		`The newsfeed operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
