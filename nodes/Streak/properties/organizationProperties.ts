import type { INodeProperties } from 'n8n-workflow';

// Helper function to create team key property for different operations
function createTeamKeyProperty(operations: string[]): INodeProperties {
	return {
		displayName: 'Team Name or ID',
		name: 'teamKey',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTeamOptions',
		},
		default: '',
		required: true,
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code-examples/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: operations,
			},
		},
	};
}

export const organizationProperties: INodeProperties[] = [
	// Organization Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['organization'],
			},
		},
		default: 'getOrganization',
		options: [
			{
				name: 'Check Existing Organizations',
				value: 'checkExistingOrganizations',
				description: 'Finds an organization by domain, and creates one if none matches',
				action: 'Check existing organizations',
			},
			{
				name: 'Create Organization',
				value: 'createOrganization',
				description: 'Creates a new organization',
				action: 'Create an organization',
			},
			{
				name: 'Delete Organization',
				value: 'deleteOrganization',
				description: 'Deletes an organization',
				action: 'Delete an organization',
			},
			{
				name: 'Get Organization',
				value: 'getOrganization',
				description: 'Gets a specific organization',
				action: 'Get an organization',
			},
			{
				name: 'Update Organization',
				value: 'updateOrganization',
				description: 'Updates an existing organization',
				action: 'Update an organization',
			},
		],
	},

	// Organization Key (for organization operations)
	{
		displayName: 'Organization Key',
		name: 'organizationKey',
		type: 'string',
		default: '',
		required: true,
		description: 'The key of the organization',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['getOrganization', 'updateOrganization', 'deleteOrganization'],
			},
		},
	},

	// Name (for createOrganization)
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		description:
			'The name of the organization. Required unless you add Domains, in which case Streak can name it from the domain.',
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['createOrganization'],
			},
		},
	},

	// Return Existing If Found (for createOrganization), sent as Streak's getIfExisting flag
	{
		displayName: 'Return Existing If Found',
		name: 'getIfExisting',
		type: 'boolean',
		default: false,
		description:
			"Whether to return the organization that already has one of the Domains instead of creating another. Streak matches by domain only, so this does nothing without Domains. A matching organization is returned as it is: the other values set here aren't applied to it.",
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['createOrganization'],
			},
		},
	},

	// Team Key (for createOrganization)
	createTeamKeyProperty(['createOrganization']),

	// Team Key (for checkExistingOrganizations)
	createTeamKeyProperty(['checkExistingOrganizations']),

	// Check Fields (for checkExistingOrganizations)
	{
		displayName: 'Check Fields',
		name: 'checkFields',
		type: 'collection',
		placeholder: 'Add Check Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['checkExistingOrganizations'],
			},
		},
		options: [
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: [],
				description: 'Website domains to look up (e.g., example.com). Streak matches by domain only, not by name, and creates an organization with these domains if none matches.',
			},
		],
	},

	// Additional Fields (for createOrganization)
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['createOrganization'],
			},
		},
		options: [
			{
				displayName: 'Addresses',
				name: 'addresses',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description:
					'Addresses associated with the organization. Can be a single address or multiple addresses. The Streak API replaces all existing addresses with the ones you provide (does not merge).',
			},
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description: 'Domains associated with the organization',
			},
			{
				displayName: 'Employee Count',
				name: 'employeeCount',
				type: 'string',
				default: '',
				description: 'Employee count at the organization',
			},
			{
				displayName: 'Facebook Handle',
				name: 'facebookHandle',
				type: 'string',
				default: '',
				description: 'Facebook handle for the organization',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Organization industry',
			},
			{
				displayName: 'LinkedIn Handle',
				name: 'linkedInHandle',
				type: 'string',
				default: '',
				description: 'LinkedIn handle for the organization',
			},
			{
				displayName: 'Logo URL',
				name: 'logoUrl',
				type: 'string',
				default: '',
				description: "URL of the organization's logo",
			},
			{
				displayName: 'Other',
				name: 'other',
				type: 'string',
				default: '',
				description: 'Notes or other uncategorized information',
			},
			{
				displayName: 'Phone Numbers',
				name: 'phoneNumbers',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description:
					'Phone numbers associated with the organization. Can be a single number or multiple numbers. The Streak API replaces all existing numbers with the ones you provide (does not merge).',
			},
			{
				displayName: 'Twitter Handle',
				name: 'twitterHandle',
				type: 'string',
				default: '',
				description: 'Twitter handle for the organization',
			},
		],
	},

	// Update Fields (for updateOrganization)
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['organization'],
				operation: ['updateOrganization'],
			},
		},
		options: [
			{
				displayName: 'Addresses',
				name: 'addresses',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description:
					'Addresses associated with the organization. Can be a single address or multiple addresses. The Streak API replaces all existing addresses with the ones you provide (does not merge).',
			},
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description: 'New domains for the organization',
			},
			{
				displayName: 'Employee Count',
				name: 'employeeCount',
				type: 'string',
				default: '',
				description: 'Employee count at the organization',
			},
			{
				displayName: 'Facebook Handle',
				name: 'facebookHandle',
				type: 'string',
				default: '',
				description: 'Facebook handle for the organization',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'string',
				default: '',
				description: 'Organization industry',
			},
			{
				displayName: 'LinkedIn Handle',
				name: 'linkedInHandle',
				type: 'string',
				default: '',
				description: 'LinkedIn handle for the organization',
			},
			{
				displayName: 'Logo URL',
				name: 'logoUrl',
				type: 'string',
				default: '',
				description: "URL of the organization's logo",
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'New name for the organization',
			},
			{
				displayName: 'Other',
				name: 'other',
				type: 'string',
				default: '',
				description: 'Notes or other uncategorized information',
			},
			{
				displayName: 'Phone Numbers',
				name: 'phoneNumbers',
				type: 'string',
				typeOptions: {
					multipleValues: true,
				},
				default: '',
				description:
					'Phone numbers associated with the organization. Can be a single number or multiple numbers. The Streak API replaces all existing numbers with the ones you provide (does not merge).',
			},
			{
				displayName: 'Twitter Handle',
				name: 'twitterHandle',
				type: 'string',
				default: '',
				description: 'Twitter handle for the organization',
			},
		],
	},
];
