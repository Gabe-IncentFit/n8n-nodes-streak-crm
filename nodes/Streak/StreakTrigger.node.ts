import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { streakApiRequest } from './operations/utils';

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
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{ name: 'Box Change Pipeline', value: 'BOX_CHANGE_PIPELINE' },
					{ name: 'Box Change Stage', value: 'BOX_CHANGE_STAGE' },
					{ name: 'Box Create', value: 'BOX_CREATE' },
					{ name: 'Box Delete', value: 'BOX_DELETE' },
					{ name: 'Box Edit', value: 'BOX_EDIT' },
					{ name: 'Box New Email Address', value: 'BOX_NEW_EMAIL_ADDRESS' },
					{ name: 'Comment Create', value: 'COMMENT_CREATE' },
					{ name: 'Contact Create', value: 'CONTACT_CREATE' },
					{ name: 'Contact Delete', value: 'CONTACT_DELETE' },
					{ name: 'Contact Update', value: 'CONTACT_UPDATE' },
					{ name: 'Meeting Create', value: 'MEETING_CREATE' },
					{ name: 'Meeting Update', value: 'MEETING_UPDATE' },
					{ name: 'Org Create', value: 'ORG_CREATE' },
					{ name: 'Org Delete', value: 'ORG_DELETE' },
					{ name: 'Org Update', value: 'ORG_UPDATE' },
					{ name: 'Stage Create', value: 'STAGE_CREATE' },
					{ name: 'Task Complete', value: 'TASK_COMPLETE' },
					{ name: 'Task Create', value: 'TASK_CREATE' },
					{ name: 'Task Due', value: 'TASK_DUE' },
					{ name: 'Task Updated', value: 'TASK_UPDATED' },
				],
				default: 'BOX_CREATE',
				required: true,
				description: 'The event to listen for',
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

			async getTeamOptions(this: ILoadOptionsFunctions) {
				const response = (await streakApiRequest(
					this,
					'GET',
					'/users/me/teams',
				)) as Array<{ results?: Array<{ key: string; name: string }> }>;

				const teams: Array<{ key: string; name: string }> = [];
				if (Array.isArray(response)) {
					for (const item of response) {
						if (item?.results && Array.isArray(item.results)) {
							teams.push(...item.results);
						}
					}
				}

				return teams
					.filter((t) => t && t.key)
					.map((t) => ({
						name: t.name || 'Unnamed Team',
						value: t.key,
					}));
			},
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
				let existingWebhooks: IDataObject[] = [];

				try {
					if (scope === 'pipeline') {
						const pipelineKey = this.getNodeParameter('pipelineKey') as string;
						existingWebhooks = (await streakApiRequest(
							this,
							'GET',
							`/pipelines/${pipelineKey}/webhooks`,
						)) as IDataObject[];
					} else {
						const teamKey = this.getNodeParameter('teamKey') as string;
						existingWebhooks = (await streakApiRequest(
							this,
							'GET',
							`/teams/${teamKey}/webhooks`,
						)) as IDataObject[];
					}
				} catch (error: unknown) {
					if (error instanceof Error) {
						this.logger.warn(`Streak webhook check failed: ${error.message}`);
					}
					return false;
				}

				if (!Array.isArray(existingWebhooks)) {
					return false;
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

				const body: IDataObject = {
					event,
					targetUrl: webhookUrl,
				};

				if (scope === 'pipeline') {
					body.pipelineKey = this.getNodeParameter('pipelineKey') as string;
				} else {
					body.teamKey = this.getNodeParameter('teamKey') as string;
				}

				const response = (await streakApiRequest(
					this,
					'POST',
					'/webhooks',
					body,
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
