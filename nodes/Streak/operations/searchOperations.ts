import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';

/**
 * Handle search-related operations for the Streak API
 */
export async function handleSearchOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'searchByQuery' || operation === 'searchByName') {
		const qs: IDataObject = {};

		if (operation === 'searchByQuery') {
			const query = this.getNodeParameter('query', itemIndex) as string;
			validateParameters.call(this, { query }, ['query'], itemIndex);
			qs.query = query;
		} else {
			const name = this.getNodeParameter('name', itemIndex) as string;
			validateParameters.call(this, { name }, ['name'], itemIndex);
			qs.name = name;
		}

		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		if (additionalFields.page !== undefined) {
			qs.page = additionalFields.page;
		}

		if (additionalFields.pipelineKey) {
			qs.pipelineKey = additionalFields.pipelineKey;
		}

		if (additionalFields.stageKey) {
			qs.stageKey = additionalFields.stageKey;
		}

		return await streakApiRequest(this, 'GET', '/search', undefined, qs, 'v1');
	}

	throw new NodeOperationError(
		this.getNode(),
		`The search operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
