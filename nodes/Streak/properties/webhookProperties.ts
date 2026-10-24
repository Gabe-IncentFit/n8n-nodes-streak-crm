import type { INodeProperties } from 'n8n-workflow';

import { PIPELINE_WEBHOOK_EVENTS, TEAM_WEBHOOK_EVENTS } from './webhookEvents';

export const webhookProperties: INodeProperties[] = [
	// Webhook Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['webhook'],
			},
		},
		default: 'listWebhooks',
		options: [
			{
				name: 'Create Webhook',
				value: 'createWebhook',
				description: 'Creates a new webhook',
				action: 'Create a webhook',
			},
			{
				name: 'Delete Webhook',
				value: 'deleteWebhook',
				description: 'Deletes a webhook',
				action: 'Delete a webhook',
			},
			{
				name: 'Get Webhook',
				value: 'getWebhook',
				description: 'Gets a specific webhook',
				action: 'Get a webhook',
			},
			{
				name: 'List Webhooks',
				value: 'listWebhooks',
				description: 'Lists all webhooks for a pipeline or team',
				action: 'List webhooks',
			},
		],
	},

	// Webhook Key (for get/delete)
	{
		displayName: 'Webhook Key',
		name: 'webhookKey',
		type: 'string',
		default: '',
		required: true,
		description: 'The key of the webhook',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['getWebhook', 'deleteWebhook'],
			},
		},
	},

	// Scope (for list and create)
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
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['listWebhooks', 'createWebhook'],
			},
		},
	},

	// Pipeline Key (when scope=pipeline)
	{
		displayName: 'Pipeline Name or ID',
		name: 'pipelineKey',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getPipelineOptions',
		},
		default: '',
		required: true,
		description: 'The pipeline to scope the webhook to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['listWebhooks', 'createWebhook'],
				scope: ['pipeline'],
			},
		},
	},

	// Team Key (when scope=team)
	{
		displayName: 'Team Name or ID',
		name: 'teamKey',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeamOptions',
		},
		default: '',
		required: true,
		description: 'The team to scope the webhook to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['listWebhooks', 'createWebhook'],
				scope: ['team'],
			},
		},
	},

	// Event (for create). Streak only allows pipeline events on pipeline webhooks and team events on team webhooks
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
				resource: ['webhook'],
				operation: ['createWebhook'],
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
				resource: ['webhook'],
				operation: ['createWebhook'],
				scope: ['team'],
			},
		},
	},

	// Target URL (for create)
	{
		displayName: 'Target URL',
		name: 'targetUrl',
		type: 'string',
		default: '',
		required: true,
		description: 'The URL that will receive the webhook POST requests',
		displayOptions: {
			show: {
				resource: ['webhook'],
				operation: ['createWebhook'],
			},
		},
	},
];
