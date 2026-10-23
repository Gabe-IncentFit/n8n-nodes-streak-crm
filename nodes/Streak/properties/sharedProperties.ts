import type { INodeProperties } from 'n8n-workflow';

export const sharedProperties: INodeProperties[] = [
	// Return All option for list operations
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['pipeline', 'box', 'field', 'thread', 'file', 'comment', 'meeting', 'newsfeed', 'snippet', 'task'],
				operation: [
					'listAllPipelines',
					'listBoxes',
					'getTimeline',
					'listFields',
					'listFieldValues',
					'listThreadsInBox',
					'listFilesInBox',
					'listCommentsInBox',
					'listMeetingsInBox',
					'getPipelineNewsfeed',
					'getBoxNewsfeed',
					'getAllNewsfeed',
					'listSnippets',
					'getTasksInBox',
				],
			},
		},
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		description: 'Max number of results to return',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['pipeline', 'box', 'field', 'thread', 'file', 'comment', 'meeting', 'newsfeed', 'snippet', 'task'],
				operation: [
					'listAllPipelines',
					'listBoxes',
					'getTimeline',
					'listFields',
					'listFieldValues',
					'listThreadsInBox',
					'listFilesInBox',
					'listCommentsInBox',
					'listMeetingsInBox',
					'getPipelineNewsfeed',
					'getBoxNewsfeed',
					'getAllNewsfeed',
					'listSnippets',
					'getTasksInBox',
				],
				returnAll: [false],
			},
		},
	},
	// Page option, only for list operations whose Streak endpoint pages by page/limit
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: 0,
		description:
			'Which page of results to fetch, starting at 0. Each page holds up to Limit results, so add 1 to get the next page. Streak returns at most 1000 boxes or tasks per page and documents no maximum for meetings. List Boxes only supports page 0 when Search Query is set.',
		typeOptions: {
			minValue: 0,
			numberPrecision: 0,
		},
		displayOptions: {
			show: {
				resource: ['box', 'task', 'meeting'],
				operation: ['listBoxes', 'getTasksInBox', 'listMeetingsInBox'],
				returnAll: [false],
			},
		},
	},
];
