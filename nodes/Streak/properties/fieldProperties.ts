import type { INodeProperties } from 'n8n-workflow';

export const fieldProperties: INodeProperties[] = [
	// Field Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['field'],
			},
		},
		default: 'listFields',
		options: [
			{
				name: 'Create Field in a Pipeline',
				value: 'createField',
				description: 'Creates a new field in a pipeline',
				action: 'Create a field in a pipeline',
			},
			{
				name: 'Delete Field',
				value: 'deleteField',
				description: 'Deletes a field',
				action: 'Delete a field',
			},
			{
				name: 'Get Field',
				value: 'getField',
				description: 'Gets a specific field by its key',
				action: 'Get a field',
			},
			{
				name: 'Get Field Value in a Box',
				value: 'getFieldValue',
				description: 'Gets a specific field value for a box',
				action: 'Get a field value in a box',
			},
			{
				name: 'List Field Values in a Box',
				value: 'listFieldValues',
				description: 'Lists all field values for a box',
				action: 'List field values in a box',
			},
			{
				name: 'List Fields in a Pipeline',
				value: 'listFields',
				description: 'Lists all fields in a pipeline',
				action: 'List fields in a pipeline',
			},
			{
				name: 'Update Field',
				value: 'updateField',
				description: 'Updates an existing field',
				action: 'Update a field',
			},
			{
				name: 'Update Field Value in a Box',
				value: 'updateFieldValue',
				description: 'Updates a field value for a box',
				action: 'Update a field value in a box',
			},
		],
	},

	// Pipeline Key (for field operations)
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
				resource: ['field'],
				operation: ['listFields', 'getField', 'createField', 'updateField', 'deleteField'],
			},
		},
	},

	// Pipeline (optional, used to populate the box dropdown)
	{
		displayName: 'Pipeline',
		name: 'pipelineKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		description: 'Optional. Select a pipeline to populate the Box dropdown below. Not needed if entering a Box ID directly.',
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
				resource: ['field'],
				operation: ['listFieldValues', 'getFieldValue', 'updateFieldValue'],
			},
		},
	},

	// Box Key (for field value operations)
	{
		displayName: 'Box',
		name: 'boxKey',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		description: 'The box to operate on',
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'getBoxOptions',
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
				resource: ['field'],
				operation: ['listFieldValues', 'getFieldValue', 'updateFieldValue'],
			},
		},
	},

	// Field Key (for field operations)
	{
		displayName: 'Field Key',
		name: 'fieldKey',
		type: 'string',
		default: '',
		required: true,
		description: 'The key of the field',
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['getField', 'updateField', 'deleteField', 'getFieldValue', 'updateFieldValue'],
			},
		},
	},

	// Field Name (for createField)
	{
		displayName: 'Field Name',
		name: 'fieldName',
		type: 'string',
		default: '',
		required: true,
		description: 'The name of the field to create',
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['createField'],
			},
		},
	},

	// Field Type (for createField)
	{
		displayName: 'Field Type',
		name: 'fieldType',
		type: 'options',
		options: [
			{
				name: 'Checkbox',
				value: 'CHECKBOX',
				description: 'Checkbox field (boolean)',
			},
			{
				name: 'Date',
				value: 'DATE',
				description: 'Date field',
			},
			{
				name: 'Dropdown',
				value: 'DROPDOWN',
				description: 'Dropdown selection field',
			},
			{
				name: 'Formula',
				value: 'FORMULA',
				description: 'Formula field for calculations',
			},
			{
				name: 'Person',
				value: 'PERSON',
				description: 'Person field',
			},
			{
				name: 'Tag',
				value: 'TAG',
				description: 'Tag field for labels',
			},
			{
				name: 'Team Contact',
				value: 'TEAM_CONTACT',
				description: 'Team contact field',
			},
			{
				name: 'Team Organization',
				value: 'TEAM_ORGANIZATION',
				description: 'Team organization field',
			},
			{
				name: 'Text Input',
				value: 'TEXT_INPUT',
				description: 'Single line text field',
			},
		],
		default: 'TEXT_INPUT',
		required: true,
		description: 'The type of field to create',
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['createField'],
			},
		},
	},

	// Dropdown Values (for createField with a dropdown type)
	{
		displayName: 'Dropdown Values',
		name: 'enumValues',
		type: 'string',
		typeOptions: {
			multipleValues: true,
		},
		default: '',
		required: true,
		description: "The dropdown's options, one per value",
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['createField'],
				fieldType: ['DROPDOWN'],
			},
		},
	},

	// Update Fields (for updateField)
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['updateField'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the field',
			},
			{
				displayName: 'Dropdown Values',
				name: 'enumValues',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description:
					"Replaces a dropdown field's options. An option listed under its current name keeps its key, so boxes that use it keep their value.",
			},
		],
	},

	// Field Value (for updateFieldValue)
	{
		displayName: 'Field Value',
		name: 'fieldValue',
		type: 'string',
		default: '',
		required: true,
		description:
			'The value to set. Checkbox: true or false. Tag: tag names or keys, separated by commas. Dropdown: the option name or key. Date: a date or epoch milliseconds.',
		displayOptions: {
			show: {
				resource: ['field'],
				operation: ['updateFieldValue'],
			},
		},
	},
];
