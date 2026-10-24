import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';

/**
 * Handle organization-related operations for the Streak API
 */
export async function handleOrganizationOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle organization operations
	if (operation === 'getOrganization') {
		// Get Organization operation
		const organizationKey = this.getNodeParameter('organizationKey', itemIndex) as string;

		validateParameters.call(this, { organizationKey }, ['organizationKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/organizations/${organizationKey}`);
	} else if (operation === 'createOrganization') {
		// Create Organization operation
		const teamKey = this.getNodeParameter('teamKey', itemIndex) as string;
		const name = this.getNodeParameter('name', itemIndex, '') as string;
		const getIfExisting = this.getNodeParameter('getIfExisting', itemIndex, false) as boolean;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(this, { teamKey }, ['teamKey'], itemIndex);

		// Streak creates an organization from a name or a domain; without a name it names it itself
		const hasDomains = Array.isArray(additionalFields.domains) && additionalFields.domains.length > 0;
		if (!name && !hasDomains) {
			throw new NodeOperationError(
				this.getNode(),
				'Set a Name or at least one Domain to create an organization',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		if (name) {
			body.name = name;
		}

		if (additionalFields.addresses) {
			// Addresses field must be an array - convert string to array if needed
			body.addresses = Array.isArray(additionalFields.addresses)
				? additionalFields.addresses
				: [additionalFields.addresses];
		}

		if (additionalFields.domains && (additionalFields.domains as string[]).length > 0) {
			body.domains = additionalFields.domains;
		}

		if (additionalFields.employeeCount) {
			body.employeeCount = additionalFields.employeeCount;
		}

		if (additionalFields.facebookHandle) {
			body.facebookHandle = additionalFields.facebookHandle;
		}

		if (additionalFields.industry) {
			body.industry = additionalFields.industry;
		}

		// Streak spells these linkedinHandle and logoURL, and silently drops other spellings
		if (additionalFields.linkedInHandle) {
			body.linkedinHandle = additionalFields.linkedInHandle;
		}

		if (additionalFields.logoUrl) {
			body.logoURL = additionalFields.logoUrl;
		}

		if (additionalFields.other) {
			body.other = additionalFields.other;
		}

		if (additionalFields.phoneNumbers) {
			// phoneNumbers field must be an array - convert string to array if needed
			body.phoneNumbers = Array.isArray(additionalFields.phoneNumbers)
				? additionalFields.phoneNumbers
				: [additionalFields.phoneNumbers];
		}

		if (additionalFields.twitterHandle) {
			body.twitterHandle = additionalFields.twitterHandle;
		}

		// With getIfExisting, Streak returns an organization that has one of the domains instead of
		// creating a duplicate. Without it, Streak always creates, even if the domain is taken.
		const query = getIfExisting ? { getIfExisting: true } : undefined;

		return await streakApiRequest(this, 'POST', `/teams/${teamKey}/organizations`, body, query);
	} else if (operation === 'checkExistingOrganizations') {
		// Check Existing Organizations operation
		const teamKey = this.getNodeParameter('teamKey', itemIndex) as string;
		const checkFields = this.getNodeParameter('checkFields', itemIndex) as IDataObject;

		validateParameters.call(this, { teamKey }, ['teamKey'], itemIndex);

		if (!checkFields.domains || !(checkFields.domains as string[])?.length) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one domain must be specified for checking existing organizations',
				{ itemIndex },
			);
		}

		const body: IDataObject = {
			domains: checkFields.domains,
		};

		return await streakApiRequest(
			this,
			'POST',
			`/teams/${teamKey}/organizations?getIfExisting=true`,
			body,
		);
	} else if (operation === 'updateOrganization') {
		// Update Organization operation
		const organizationKey = this.getNodeParameter('organizationKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { organizationKey }, ['organizationKey'], itemIndex);

		const body: IDataObject = {};

		if (updateFields.addresses) {
			// Addresses field must be an array - convert string to array if needed
			body.addresses = Array.isArray(updateFields.addresses)
				? updateFields.addresses
				: [updateFields.addresses];
		}

		if (updateFields.domains && (updateFields.domains as string[]).length > 0) {
			body.domains = updateFields.domains;
		}

		if (updateFields.employeeCount) {
			body.employeeCount = updateFields.employeeCount;
		}

		if (updateFields.facebookHandle) {
			body.facebookHandle = updateFields.facebookHandle;
		}

		if (updateFields.industry) {
			body.industry = updateFields.industry;
		}

		// Streak spells these linkedinHandle and logoURL, and silently drops other spellings
		if (updateFields.linkedInHandle) {
			body.linkedinHandle = updateFields.linkedInHandle;
		}

		if (updateFields.logoUrl) {
			body.logoURL = updateFields.logoUrl;
		}

		if (updateFields.name) {
			body.name = updateFields.name;
		}

		if (updateFields.other) {
			body.other = updateFields.other;
		}

		if (updateFields.phoneNumbers) {
			// phoneNumbers field must be an array - convert string to array if needed
			body.phoneNumbers = Array.isArray(updateFields.phoneNumbers)
				? updateFields.phoneNumbers
				: [updateFields.phoneNumbers];
		}

		if (updateFields.twitterHandle) {
			body.twitterHandle = updateFields.twitterHandle;
		}

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		return await streakApiRequest(this, 'POST', `/organizations/${organizationKey}`, body);
	} else if (operation === 'deleteOrganization') {
		// Delete Organization operation
		const organizationKey = this.getNodeParameter('organizationKey', itemIndex) as string;

		validateParameters.call(this, { organizationKey }, ['organizationKey'], itemIndex);

		return await streakApiRequest(this, 'DELETE', `/organizations/${organizationKey}`);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The organization operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
