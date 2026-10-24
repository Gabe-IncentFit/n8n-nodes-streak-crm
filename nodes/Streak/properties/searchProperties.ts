import type { INodeProperties } from 'n8n-workflow';

export const searchProperties: INodeProperties[] = [
	// Search Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['search'],
			},
		},
		default: 'searchByQuery',
		options: [
			{
				name: 'Search by Name',
				value: 'searchByName',
				description: 'Search for boxes by exact name match',
				action: 'Search boxes by name',
			},
			{
				name: 'Search by Query',
				value: 'searchByQuery',
				description: 'Search across boxes, contacts, and organizations',
				action: 'Search streak data',
			},
		],
	},

	// Search Query (for searchByQuery)
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		required: true,
		description:
			'The search query string. Searches across box names, notes, emails, text formula fields, and freeform text fields.',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchByQuery'],
			},
		},
	},

	// Name (for searchByName)
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		description: 'The exact box name to search for',
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchByName'],
			},
		},
	},

	// Filters shared by both operations
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['search'],
				operation: ['searchByQuery', 'searchByName'],
			},
		},
		options: [
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 0,
				description: 'Which page of results to fetch, starting at 0',
			},
			{
				displayName: 'Pipeline Key',
				name: 'pipelineKey',
				type: 'string',
				default: '',
				description: 'Limit search to boxes in a specific pipeline. Only affects box results.',
			},
			{
				displayName: 'Stage Key',
				name: 'stageKey',
				type: 'string',
				default: '',
				description: 'Limit search to boxes in a specific stage. Only affects box results.',
			},
		],
	},
];
