import type { INodeProperties } from 'n8n-workflow';

export const fileProperties: INodeProperties[] = [
	// File Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		default: 'listFilesInBox',
		options: [
			{
				name: 'Add File to Box',
				value: 'addFileToBox',
				description: 'Adds a Google Drive file to a box',
				action: 'Add a file to a box',
			},
			{
				name: 'Get File Contents',
				value: 'getFileContents',
				description:
					'Downloads a file as binary data (only works for GMAIL_API file types)',
				action: 'Get file contents',
			},
			{
				name: 'Get File Metadata',
				value: 'getFile',
				description: 'Gets metadata for a specific file',
				action: 'Get file metadata',
			},
			{
				name: 'List Files in Box',
				value: 'listFilesInBox',
				description: 'Lists all files associated with a box',
				action: 'List files in a box',
			},
		],
	},

	// File Key (for get/getContents)
	{
		displayName: 'File Key',
		name: 'fileKey',
		type: 'string',
		default: '',
		required: true,
		description: 'The key of the file',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['getFile', 'getFileContents'],
			},
		},
	},

	// Binary output field (for getFileContents)
	{
		displayName: 'Put Output File in Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		hint: 'The name of the output binary field to put the file in',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['getFileContents'],
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
				resource: ['file'],
				operation: ['listFilesInBox', 'addFileToBox'],
			},
		},
	},

	// Box Key (for list/add)
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
				resource: ['file'],
				operation: ['listFilesInBox', 'addFileToBox'],
			},
		},
	},

	// Drive File IDs (for add)
	{
		displayName: 'Google Drive File IDs',
		name: 'driveFileId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 1AbC..., 1DeF...',
		description:
			'One or more Google Drive file IDs to add to the box, separated by commas or new lines. All of them are added in a single request.',
		displayOptions: {
			show: {
				resource: ['file'],
				operation: ['addFileToBox'],
			},
		},
	},
];
