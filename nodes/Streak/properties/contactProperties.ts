import type { INodeProperties } from 'n8n-workflow';

export const contactProperties: INodeProperties[] = [
	// Contact Operations
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['contact'],
			},
		},
		default: 'getContact',
		options: [
			{
				name: 'Get Contact',
				value: 'getContact',
				description: 'Gets a specific contact',
				action: 'Get a contact',
			},
			{
				name: 'Create Contact',
				value: 'createContact',
				description: 'Creates a new contact',
				action: 'Create a contact',
			},
			{
				name: 'Update Contact',
				value: 'updateContact',
				description: 'Updates an existing contact',
				action: 'Update a contact',
			},
			{
				name: 'Delete Contact',
				value: 'deleteContact',
				description: 'Deletes a contact',
				action: 'Delete a contact',
			},
		],
	},

	// Contact Key (for contact operations)
	{
		displayName: 'Contact Key',
		name: 'contactKey',
		type: 'string',
		default: '',
		required: true,
		description: 'The key of the contact',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['getContact', 'updateContact', 'deleteContact'],
			},
		},
	},

	// Email Addresses (for createContact)
	{
		displayName: 'Email Addresses',
		name: 'emailAddresses',
		type: 'string',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Email',
		},
		placeholder: 'name@email.com',
		default: [],
		description: 'Email addresses for the contact (at least one email or name is required)',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createContact'],
			},
		},
	},

	// Given Name (for createContact)
	{
		displayName: 'Given Name',
		name: 'givenName',
		type: 'string',
		default: '',
		description: 'First name of the contact (at least one name or email is required)',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createContact'],
			},
		},
	},

	// Family Name (for createContact)
	{
		displayName: 'Family Name',
		name: 'familyName',
		type: 'string',
		default: '',
		description: 'Last name of the contact',
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createContact'],
			},
		},
	},

	// Team Key (for createContact)
	{
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
				resource: ['contact'],
				operation: ['createContact'],
			},
		},
	},

	// Additional Fields (for createContact)
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['createContact'],
			},
		},
		options: [
			{
				displayName: 'Addresses',
				name: 'addresses',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Address',
				},
				default: [],
				description: 'Addresses for the contact',
			},
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Domain',
				},
				placeholder: 'example.com',
				default: [],
				description: 'Website domains for the contact',
			},
			{
				displayName: 'Facebook Handle',
				name: 'facebookHandle',
				type: 'string',
				default: '',
				description: 'Facebook handle of the contact',
			},
			{
				displayName: 'Instagram Handle',
				name: 'instagramHandle',
				type: 'string',
				default: '',
				description: 'Instagram handle of the contact',
			},
			{
				displayName: 'LinkedIn Handle',
				name: 'linkedinHandle',
				type: 'string',
				default: '',
				description: 'LinkedIn handle of the contact',
			},
			{
				displayName: 'Other',
				name: 'other',
				type: 'string',
				default: '',
				description: 'Other information about the contact',
			},
			{
				displayName: 'Phone Numbers',
				name: 'phoneNumbers',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Phone',
				},
				default: [],
				description: 'Phone numbers for the contact',
			},
			{
				displayName: 'Photo URL',
				name: 'photoUrl',
				type: 'string',
				default: '',
				description: 'URL to photo of the contact',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'Job title of the contact',
			},
			{
				displayName: 'Twitter Handle',
				name: 'twitterHandle',
				type: 'string',
				default: '',
				description: 'Twitter handle of the contact',
			},
		],
	},

	// Update Fields (for updateContact)
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['contact'],
				operation: ['updateContact'],
			},
		},
		options: [
			{
				displayName: 'Addresses',
				name: 'addresses',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Address',
				},
				default: [],
				description: 'New addresses for the contact',
			},
			{
				displayName: 'Custom Fields',
				name: 'customFields',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Custom Field',
				default: {},
				description: "Values for the team's custom contact fields. Fields you leave out keep their values.",
				options: [
					{
						displayName: 'Field',
						name: 'field',
						values: [
							{
								displayName: 'Field Name or ID',
								name: 'key',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getContactFieldOptions',
								},
								default: '',
								description:
									'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Text to store in the field',
							},
						],
					},
				],
			},
			{
				displayName: 'Domains',
				name: 'domains',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Domain',
				},
				placeholder: 'example.com',
				default: [],
				description: 'New website domains for the contact',
			},
			{
				displayName: 'Email Addresses',
				name: 'emailAddresses',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Email',
				},
				placeholder: 'name@email.com',
				default: [],
				description: 'New email addresses for the contact',
			},
			{
				displayName: 'Facebook Handle',
				name: 'facebookHandle',
				type: 'string',
				default: '',
				description: 'New Facebook handle for the contact',
			},
			{
				displayName: 'Family Name',
				name: 'familyName',
				type: 'string',
				default: '',
				description: 'New last name for the contact',
			},
			{
				displayName: 'Given Name',
				name: 'givenName',
				type: 'string',
				default: '',
				description: 'New first name for the contact',
			},
			{
				displayName: 'Instagram Handle',
				name: 'instagramHandle',
				type: 'string',
				default: '',
				description: 'New Instagram handle for the contact',
			},
			{
				displayName: 'Linked Contacts',
				name: 'contactLinks',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Contact Key',
				},
				default: [],
				description:
					'Keys of the contacts to link to this contact. Replaces all of its current contact links, so include any you want to keep. Leave the list empty to remove them all.',
			},
			{
				displayName: 'Linked Organizations',
				name: 'orgLinks',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Organization Key',
				},
				default: [],
				description:
					'Keys of the organizations to link to this contact. Replaces all of its current organization links, so include any you want to keep. Leave the list empty to remove them all.',
			},
			{
				displayName: 'LinkedIn Handle',
				name: 'linkedinHandle',
				type: 'string',
				default: '',
				description: 'New LinkedIn handle for the contact',
			},
			{
				displayName: 'Other',
				name: 'other',
				type: 'string',
				default: '',
				description: 'New other information for the contact',
			},
			{
				displayName: 'Phone Numbers',
				name: 'phoneNumbers',
				type: 'string',
				typeOptions: {
					multipleValues: true,
					multipleValueButtonText: 'Add Phone',
				},
				default: [],
				description: 'New phone numbers for the contact',
			},
			{
				displayName: 'Photo URL',
				name: 'photoUrl',
				type: 'string',
				default: '',
				description: 'New photo URL for the contact',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				description: 'New job title for the contact',
			},
			{
				displayName: 'Twitter Handle',
				name: 'twitterHandle',
				type: 'string',
				default: '',
				description: 'New Twitter handle for the contact',
			},
		],
	},
];
