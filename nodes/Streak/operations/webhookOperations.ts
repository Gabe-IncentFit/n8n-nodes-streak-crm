import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';
import { webhookScopeMismatch } from '../properties/webhookEvents';

/**
 * Handle webhook-related operations for the Streak API
 */
export async function handleWebhookOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listWebhooks') {
		const scope = this.getNodeParameter('scope', itemIndex) as string;

		let endpoint: string;
		if (scope === 'pipeline') {
			const pipelineKey = this.getNodeParameter('pipelineKey', itemIndex) as string;
			validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);
			endpoint = `/pipelines/${pipelineKey}/webhooks`;
		} else {
			const teamKey = this.getNodeParameter('teamKey', itemIndex) as string;
			validateParameters.call(this, { teamKey }, ['teamKey'], itemIndex);
			endpoint = `/teams/${teamKey}/webhooks`;
		}

		// Streak wraps the list as { results: [...] }; output one item per webhook
		const response = (await streakApiRequest(this, 'GET', endpoint)) as IDataObject;
		return Array.isArray(response?.results) ? (response.results as IDataObject[]) : response;
	} else if (operation === 'getWebhook') {
		const webhookKey = this.getNodeParameter('webhookKey', itemIndex) as string;

		validateParameters.call(this, { webhookKey }, ['webhookKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/webhooks/${webhookKey}`);
	} else if (operation === 'createWebhook') {
		const event = this.getNodeParameter('event', itemIndex) as string;
		const targetUrl = this.getNodeParameter('targetUrl', itemIndex) as string;
		const scope = this.getNodeParameter('scope', itemIndex) as string;

		validateParameters.call(this, { event, targetUrl }, ['event', 'targetUrl'], itemIndex);

		const mismatch = webhookScopeMismatch(event, scope);
		if (mismatch) {
			throw new NodeOperationError(this.getNode(), mismatch, { itemIndex });
		}

		const body: IDataObject = {
			event,
			targetUrl,
		};

		// Streak reads the pipeline or team key from the query string, not the body
		const query: IDataObject = {};
		if (scope === 'pipeline') {
			const pipelineKey = this.getNodeParameter('pipelineKey', itemIndex) as string;
			validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);
			query.pipelineKey = pipelineKey;
		} else {
			const teamKey = this.getNodeParameter('teamKey', itemIndex) as string;
			validateParameters.call(this, { teamKey }, ['teamKey'], itemIndex);
			query.teamKey = teamKey;
		}

		return await streakApiRequest(this, 'POST', '/webhooks', body, query);
	} else if (operation === 'deleteWebhook') {
		const webhookKey = this.getNodeParameter('webhookKey', itemIndex) as string;

		validateParameters.call(this, { webhookKey }, ['webhookKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/webhooks/${webhookKey}`);

		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Webhook deleted successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The webhook operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
