import type { INodeProperties } from 'n8n-workflow';

export const stageProperties: INodeProperties[] = [
	// Stage Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['stage'],
			},
		},
		default: 'listStages',
		options: [
			{
				name: 'Create Stage in a Pipeline',
				value: 'createStage',
				description: 'Creates a new stage in a pipeline',
				action: 'Create a stage in a pipeline',
			},
			{
				name: 'Delete Stage',
				value: 'deleteStage',
				description: 'Deletes a stage',
				action: 'Delete a stage',
			},
			{
				name: 'Get Stage',
				value: 'getStage',
				description: 'Gets a specific stage by its key',
				action: 'Get a stage',
			},
			{
				name: 'List Stages in a Pipeline',
				value: 'listStages',
				description: 'Lists all stages in a pipeline',
				action: 'List stages in a pipeline',
			},
			{
				name: 'Update Stage',
				value: 'updateStage',
				description: 'Updates an existing stage',
				action: 'Update a stage',
			},
		],
	},

	// Pipeline Key (for stage operations)
	{
		displayName: 'Pipeline',
		name: 'pipelineKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The pipeline that contains the stages',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getPipelineOptions',
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'agxzfm1haWw...',
			},
		],
		displayOptions: {
			show: {
				resource: ['stage'],
				operation: ['listStages', 'getStage', 'createStage', 'updateStage', 'deleteStage'],
			},
		},
	},

	// Stage Key (for stage operations)
	{
		displayName: 'Stage',
		name: 'stageKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The stage to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getStageOptions',
				},
			},
			{
				displayName: 'By ID',
				name: 'id',
				type: 'string',
				placeholder: 'agxzfm1haWw...',
			},
		],
		displayOptions: {
			show: {
				resource: ['stage'],
				operation: ['getStage', 'updateStage', 'deleteStage'],
			},
		},
	},

	// Stage Name (for createStage)
	{
		displayName: 'Stage Name',
		name: 'stageName',
		type: 'string',
		default: '',
		required: true,
		description: 'The name of the stage to create',
		displayOptions: {
			show: {
				resource: ['stage'],
				operation: ['createStage'],
			},
		},
	},

	// Additional Fields (for createStage)
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['stage'],
				operation: ['createStage'],
			},
		},
		options: [
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '',
				description:
					"The stage's background color (e.g., #FF0000). Its text is set to black or white, whichever reads better.",
			},
		],
	},

	// Update Fields (for updateStage)
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['stage'],
				operation: ['updateStage'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the stage',
			},
			{
				displayName: 'Color',
				name: 'color',
				type: 'color',
				default: '',
				description:
					"New background color for the stage (e.g., #00FF00). Its text is set to black or white, whichever reads better.",
			},
		],
	},
];
