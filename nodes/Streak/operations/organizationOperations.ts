import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';
import { getCustomFieldValues, toLinks } from './directoryHelpers';

/**
 * Streak needs lists as arrays. A single value from an expression becomes a one-item list,
 * and an empty string becomes an empty list.
 */
function toList(value: unknown): unknown[] {
	if (Array.isArray(value)) {
		return value;
	}
	return value === '' || value === null ? [] : [value];
}

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

		if (additionalFields.instagramHandle) {
			body.instagramHandle = additionalFields.instagramHandle;
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

		// Send every option that was added, even when empty. Streak keeps values that are left
		// out, clears text sent as an empty string and empties lists sent as an empty list.
		if (updateFields.addresses !== undefined) {
			body.addresses = toList(updateFields.addresses);
		}

		if (updateFields.domains !== undefined) {
			body.domains = toList(updateFields.domains);
		}

		if (updateFields.employeeCount !== undefined) {
			body.employeeCount = updateFields.employeeCount;
		}

		if (updateFields.facebookHandle !== undefined) {
			body.facebookHandle = updateFields.facebookHandle;
		}

		if (updateFields.industry !== undefined) {
			body.industry = updateFields.industry;
		}

		if (updateFields.instagramHandle !== undefined) {
			body.instagramHandle = updateFields.instagramHandle;
		}

		// Streak spells these linkedinHandle and logoURL, and silently drops other spellings
		if (updateFields.linkedInHandle !== undefined) {
			body.linkedinHandle = updateFields.linkedInHandle;
		}

		if (updateFields.logoUrl !== undefined) {
			body.logoURL = updateFields.logoUrl;
		}

		if (updateFields.name !== undefined) {
			body.name = updateFields.name;
		}

		if (updateFields.other !== undefined) {
			body.other = updateFields.other;
		}

		if (updateFields.phoneNumbers !== undefined) {
			body.phoneNumbers = toList(updateFields.phoneNumbers);
		}

		if (updateFields.twitterHandle !== undefined) {
			body.twitterHandle = updateFields.twitterHandle;
		}

		// Streak replaces all links of each kind with the ones sent, and an empty list removes them
		if (updateFields.contactLinks !== undefined) {
			body.contactLinks = toLinks(updateFields.contactLinks);
		}

		if (updateFields.orgLinks !== undefined) {
			body.orgLinks = toLinks(updateFields.orgLinks);
		}

		// Streak merges custom field values, so fields left out keep their values
		const fields = getCustomFieldValues.call(this, updateFields.customFields, itemIndex);
		if (fields) {
			body.fields = fields;
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
