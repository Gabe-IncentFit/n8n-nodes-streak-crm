import type { INodeProperties } from 'n8n-workflow';

export const pipelineProperties: INodeProperties[] = [
	// Pipeline Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['pipeline'],
			},
		},
		default: 'listAllPipelines',
		options: [
			{
				name: 'Create Pipeline',
				value: 'createPipeline',
				description: 'Creates a new pipeline',
				action: 'Create a pipeline',
			},
			{
				name: 'Delete Pipeline',
				value: 'deletePipeline',
				description: 'Deletes a pipeline',
				action: 'Delete a pipeline',
			},
			{
				name: 'Get Pipeline',
				value: 'getPipeline',
				description: 'Gets a specific pipeline by its key',
				action: 'Get a pipeline',
			},
			{
				name: 'List All Pipelines',
				value: 'listAllPipelines',
				description: 'Lists all pipelines the user has access to',
				action: 'List all pipelines',
			},
			{
				name: 'Move Boxes (Batch)',
				value: 'moveBoxesBatch',
				description:
					'Moves boxes to a different pipeline. Streak gives each moved box a new key, so use the keys in the output.',
				action: 'Move boxes between pipelines',
			},
			{
				name: 'Update Pipeline',
				value: 'updatePipeline',
				description: 'Updates an existing pipeline',
				action: 'Update a pipeline',
			},
		],
	},

	// Pipeline Key (for pipeline operations)
	{
		displayName: 'Pipeline',
		name: 'pipelineKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The pipeline to operate on',
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
				resource: ['pipeline'],
				operation: ['getPipeline', 'updatePipeline', 'deletePipeline', 'moveBoxesBatch'],
			},
		},
	},

	// Pipeline Name (for createPipeline only)
	{
		displayName: 'Pipeline Name',
		name: 'pipelineName',
		type: 'string',
		default: '',
		required: true,
		description: 'The name of the pipeline',
		displayOptions: {
			show: {
				resource: ['pipeline'],
				operation: ['createPipeline'],
			},
		},
	},

	// Team Key (for createPipeline only)
	{
		displayName: 'Team',
		name: 'teamKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The team to assign the pipeline to',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getTeamSearchOptions',
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
				resource: ['pipeline'],
				operation: ['createPipeline'],
			},
		},
	},

	// Stages (for createPipeline only)
	{
		displayName: 'Stages',
		name: 'stages',
		type: 'fixedCollection',
		placeholder: 'Add Stage',
		default: { stage: [] },
		required: true,
		description: 'The stages for the pipeline. Each stage must have a name.',
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				displayName: 'Stage',
				name: 'stage',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						required: true,
						description: 'The name of the stage',
					},
				],
			},
		],
		displayOptions: {
			show: {
				resource: ['pipeline'],
				operation: ['createPipeline'],
			},
		},
	},

	// Additional Options (for createPipeline only)
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['pipeline'],
				operation: ['createPipeline'],
			},
		},
		options: [
			{
				displayName: 'Team Wide',
				name: 'teamWide',
				type: 'boolean',
				default: false,
				description: 'Whether the pipeline will be shared with all users in the team',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				placeholder: 'Add Field',
				default: { field: [] },
				description: 'Custom fields that boxes in this pipeline can have',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								required: true,
								description: 'The name of the field',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								default: 'TEXT_INPUT',
								required: true,
								description: 'The type of the field',
								options: [
									{
										name: 'Checkbox',
										value: 'CHECKBOX',
									},
									{
										name: 'Date',
										value: 'DATE',
									},
									{
										name: 'Dropdown',
										value: 'DROPDOWN',
									},
									{
										name: 'Formula',
										value: 'FORMULA',
									},
									{
										name: 'Tag',
										value: 'TAG',
									},
									{
										name: 'Team Contact',
										value: 'TEAM_CONTACT',
									},
									{
										name: 'Text Input',
										value: 'TEXT_INPUT',
									},
								],
							},
						],
					},
				],
			},
		],
	},

	// Box Keys (for moveBoxesBatch)
	{
		displayName: 'Box Keys',
		name: 'boxKeys',
		type: 'string',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Box Key',
		},
		default: [],
		required: true,
		description: 'The keys of the boxes to move',
		displayOptions: {
			show: {
				resource: ['pipeline'],
				operation: ['moveBoxesBatch'],
			},
		},
	},

	// Target Pipeline Key (for moveBoxesBatch operation)
	{
		displayName: 'Pipeline Name or ID',
		name: 'targetPipelineKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>',
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
				resource: ['pipeline'],
				operation: ['moveBoxesBatch'],
			},
		},
	},

	// Update Fields (for updatePipeline)
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['pipeline'],
				operation: ['updatePipeline'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the pipeline',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'New description for the pipeline',
			},
			{
				displayName: 'Organization Wide',
				name: 'orgWide',
				type: 'boolean',
				default: false,
				description: 'Whether the pipeline should be organization-wide',
			},
			{
				displayName: 'Team Key Name or ID',
				name: 'teamKey',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getTeamOptions',
				},
				default: '',
				description:
					'Team to assign the pipeline to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	},
];
