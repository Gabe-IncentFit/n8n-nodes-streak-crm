import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { loadOptions as sharedLoadOptions } from './methods/loadOptions';
import { streakApiRequest } from './operations/utils';
import {
	PIPELINE_WEBHOOK_EVENTS,
	TEAM_WEBHOOK_EVENTS,
	webhookScopeMismatch,
} from './properties/webhookEvents';

export class StreakTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Streak Trigger',
		name: 'streakTrigger',
		icon: 'file:streak.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Starts the workflow when a Streak event occurs',
		defaults: {
			name: 'Streak Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				displayName: 'Streak API Key',
				name: 'streakApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Scope',
				name: 'scope',
				type: 'options',
				options: [
					{ name: 'Pipeline', value: 'pipeline' },
					{ name: 'Team', value: 'team' },
				],
				default: 'pipeline',
				description: 'Whether to scope the webhook to a pipeline or a team',
			},
			{
				displayName: 'Pipeline Name or ID',
				name: 'pipelineKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getPipelineOptions',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						scope: ['pipeline'],
					},
				},
				description: 'The pipeline to listen for events on. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Team Name or ID',
				name: 'teamKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTeamOptions',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						scope: ['team'],
					},
				},
				description: 'The team to listen for events on. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			// Streak only allows pipeline events on pipeline webhooks and team events on team webhooks
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: PIPELINE_WEBHOOK_EVENTS,
				default: 'BOX_CREATE',
				required: true,
				description: 'The pipeline event to listen for',
				displayOptions: {
					show: {
						scope: ['pipeline'],
					},
				},
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: TEAM_WEBHOOK_EVENTS,
				default: 'CONTACT_CREATE',
				required: true,
				description: 'The team event to listen for (contacts and organizations)',
				displayOptions: {
					show: {
						scope: ['team'],
					},
				},
			},
		],
	};

	methods = {
		loadOptions: {
			async getPipelineOptions(this: ILoadOptionsFunctions) {
				const pipelines = (await streakApiRequest(
					this,
					'GET',
					'/pipelines',
				)) as Array<{ key: string; name: string }>;

				return pipelines
					.filter((p) => p && p.key)
					.map((p) => ({
						name: p.name || 'Unnamed Pipeline',
						value: p.key,
					}));
			},

			// Shared with the Streak node, which reads Streak's { results: [...] } teams response
			getTeamOptions: sharedLoadOptions.getTeamOptions,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookUrl = this.getNodeWebhookUrl('default');

				if (webhookData.webhookKey) {
					// Verify the webhook still exists on Streak's side
					try {
						await streakApiRequest(
							this,
							'GET',
							`/webhooks/${webhookData.webhookKey}`,
						);
						return true;
					} catch {
						// Webhook no longer exists on Streak, clean up local state
						delete webhookData.webhookKey;
						return false;
					}
				}

				// Check if a webhook with this URL already exists
				const scope = this.getNodeParameter('scope') as string;
				let response: IDataObject | IDataObject[];

				try {
					if (scope === 'pipeline') {
						const pipelineKey = this.getNodeParameter('pipelineKey') as string;
						response = await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/webhooks`);
					} else {
						const teamKey = this.getNodeParameter('teamKey') as string;
						response = await streakApiRequest(this, 'GET', `/teams/${teamKey}/webhooks`);
					}
				} catch (error: unknown) {
					if (error instanceof Error) {
						this.logger.warn(`Streak webhook check failed: ${error.message}`);
					}
					return false;
				}

				// Streak returns { results: [...] }; accept a bare array too
				let existingWebhooks: IDataObject[] = [];
				if (Array.isArray(response)) {
					existingWebhooks = response;
				} else if (Array.isArray(response?.results)) {
					existingWebhooks = response.results as IDataObject[];
				}

				const event = this.getNodeParameter('event') as string;
				const existing = existingWebhooks.find(
					(wh) => wh.targetUrl === webhookUrl && wh.event === event,
				);

				if (existing) {
					webhookData.webhookKey = existing.key as string;
					return true;
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const event = this.getNodeParameter('event') as string;
				const scope = this.getNodeParameter('scope') as string;

				const mismatch = webhookScopeMismatch(event, scope);
				if (mismatch) {
					throw new NodeOperationError(this.getNode(), mismatch);
				}

				const body: IDataObject = {
					event,
					targetUrl: webhookUrl,
				};

				// Streak reads the pipeline or team key from the query string, not the body
				const query: IDataObject =
					scope === 'pipeline'
						? { pipelineKey: this.getNodeParameter('pipelineKey') as string }
						: { teamKey: this.getNodeParameter('teamKey') as string };

				const response = (await streakApiRequest(
					this,
					'POST',
					'/webhooks',
					body,
					query,
				)) as IDataObject;

				if (!response?.key) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookKey = response.key as string;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const webhookKey = webhookData.webhookKey as string;

				if (!webhookKey) {
					return true;
				}

				try {
					await streakApiRequest(
						this,
						'DELETE',
						`/webhooks/${webhookKey}`,
					);
				} catch (error: unknown) {
					// Webhook may already be deleted — log unexpected failures so operators
					// know if the webhook was orphaned on Streak's side
					if (error instanceof Error) {
						this.logger.warn(
							`Failed to delete Streak webhook ${webhookKey}: ${error.message}`,
						);
					}
				}

				delete webhookData.webhookKey;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
