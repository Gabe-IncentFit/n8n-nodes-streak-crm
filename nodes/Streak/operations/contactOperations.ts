import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters } from './utils';
import { getCustomFieldValues, toLinks } from './directoryHelpers';

/**
 * Handle contact-related operations for the Streak API
 */
export async function handleContactOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle contact operations
	if (operation === 'getContact') {
		// Get Contact operation
		const contactKey = this.getNodeParameter('contactKey', itemIndex) as string;

		validateParameters.call(this, { contactKey }, ['contactKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/contacts/${contactKey}`);
	} else if (operation === 'createContact') {
		// Create Contact operation
		const teamKey = this.getNodeParameter('teamKey', itemIndex) as string;
		const emailAddresses = this.getNodeParameter('emailAddresses', itemIndex, []) as string[];
		const givenName = this.getNodeParameter('givenName', itemIndex, '') as string;
		const familyName = this.getNodeParameter('familyName', itemIndex, '') as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(this, { teamKey }, ['teamKey'], itemIndex);

		// Check that at least one of name or email is provided (API requirement)
		const hasName = givenName || familyName;
		const hasEmail = emailAddresses && emailAddresses.length > 0;

		if (!hasName && !hasEmail) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one name (Given Name or Family Name) or email address must be provided',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		// Add email addresses if provided
		if (hasEmail) {
			body.emailAddresses = emailAddresses;
		}

		// Add names if provided
		if (givenName) {
			body.givenName = givenName;
		}

		if (familyName) {
			body.familyName = familyName;
		}

		// Add additional fields
		if (additionalFields.title !== undefined) {
			body.title = additionalFields.title;
		}

		if (additionalFields.phoneNumbers !== undefined) {
			body.phoneNumbers = additionalFields.phoneNumbers;
		}

		if (additionalFields.addresses !== undefined) {
			body.addresses = additionalFields.addresses;
		}

		if (additionalFields.domains !== undefined) {
			body.domains = additionalFields.domains;
		}

		if (additionalFields.other !== undefined) {
			body.other = additionalFields.other;
		}

		if (additionalFields.twitterHandle !== undefined) {
			body.twitterHandle = additionalFields.twitterHandle;
		}

		if (additionalFields.facebookHandle !== undefined) {
			body.facebookHandle = additionalFields.facebookHandle;
		}

		if (additionalFields.linkedinHandle !== undefined) {
			body.linkedinHandle = additionalFields.linkedinHandle;
		}

		if (additionalFields.instagramHandle !== undefined) {
			body.instagramHandle = additionalFields.instagramHandle;
		}

		if (additionalFields.photoUrl !== undefined) {
			body.photoUrl = additionalFields.photoUrl;
		}

		return await streakApiRequest(this, 'POST', `/teams/${teamKey}/contacts/`, body);
	} else if (operation === 'updateContact') {
		// Update Contact operation
		const contactKey = this.getNodeParameter('contactKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { contactKey }, ['contactKey'], itemIndex);

		const body: IDataObject = {};

		// Handle array fields - always include them if they're defined (even if empty)
		if (updateFields.emailAddresses !== undefined) {
			body.emailAddresses = updateFields.emailAddresses;
		}

		if (updateFields.phoneNumbers !== undefined) {
			body.phoneNumbers = updateFields.phoneNumbers;
		}

		if (updateFields.addresses !== undefined) {
			body.addresses = updateFields.addresses;
		}

		if (updateFields.domains !== undefined) {
			body.domains = updateFields.domains;
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

		// Handle string fields - only include if not undefined
		if (updateFields.givenName !== undefined) {
			body.givenName = updateFields.givenName;
		}

		if (updateFields.familyName !== undefined) {
			body.familyName = updateFields.familyName;
		}

		if (updateFields.title !== undefined) {
			body.title = updateFields.title;
		}

		if (updateFields.other !== undefined) {
			body.other = updateFields.other;
		}

		if (updateFields.twitterHandle !== undefined) {
			body.twitterHandle = updateFields.twitterHandle;
		}

		if (updateFields.facebookHandle !== undefined) {
			body.facebookHandle = updateFields.facebookHandle;
		}

		if (updateFields.linkedinHandle !== undefined) {
			body.linkedinHandle = updateFields.linkedinHandle;
		}

		if (updateFields.instagramHandle !== undefined) {
			body.instagramHandle = updateFields.instagramHandle;
		}

		if (updateFields.photoUrl !== undefined) {
			body.photoUrl = updateFields.photoUrl;
		}

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		return await streakApiRequest(this, 'POST', `/contacts/${contactKey}`, body);
	} else if (operation === 'deleteContact') {
		// Delete Contact operation
		const contactKey = this.getNodeParameter('contactKey', itemIndex) as string;

		validateParameters.call(this, { contactKey }, ['contactKey'], itemIndex);

		return await streakApiRequest(this, 'DELETE', `/contacts/${contactKey}`);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The contact operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
