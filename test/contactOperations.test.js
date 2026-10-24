const assert = require('node:assert/strict');
const test = require('node:test');

const { handleContactOperations } = require('../dist/nodes/Streak/operations/contactOperations');
const { createContext } = require('./helpers');

test('updateContact sends domains, Instagram handle, custom fields and links the way Streak takes them', async () => {
	const context = createContext(
		{
			contactKey: 'contact_1',
			updateFields: {
				domains: ['acme.example'],
				instagramHandle: 'jane',
				customFields: {
					field: [
						{ key: '1001', value: 'West' },
						{ key: '1002', value: '' },
					],
				},
				contactLinks: ['contact_2', 'contact_3', 'contact_2'],
				orgLinks: ['org_1'],
			},
		},
		[{ key: 'contact_1' }],
	);

	await handleContactOperations.call(context, 'updateContact', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/contacts/contact_1');
	assert.deepEqual(request.body, {
		domains: ['acme.example'],
		instagramHandle: 'jane',
		fields: { 1001: 'West', 1002: '' },
		contactLinks: [{ key: 'contact_2' }, { key: 'contact_3' }],
		orgLinks: [{ key: 'org_1' }],
	});
});

test('updateContact sends an empty link list, which removes the links', async () => {
	const context = createContext(
		{ contactKey: 'contact_1', updateFields: { orgLinks: [] } },
		[{ key: 'contact_1' }],
	);

	await handleContactOperations.call(context, 'updateContact', 0);

	assert.deepEqual(context.calls[0].requestOptions.body, { orgLinks: [] });
});

test('updateContact reads link keys from text separated by commas or new lines', async () => {
	const context = createContext(
		{ contactKey: 'contact_1', updateFields: { contactLinks: 'contact_2, contact_3\ncontact_4' } },
		[{ key: 'contact_1' }],
	);

	await handleContactOperations.call(context, 'updateContact', 0);

	assert.deepEqual(context.calls[0].requestOptions.body.contactLinks, [
		{ key: 'contact_2' },
		{ key: 'contact_3' },
		{ key: 'contact_4' },
	]);
});

test('updateContact with a custom field entry that has no field fails before calling Streak', async () => {
	const context = createContext(
		{ contactKey: 'contact_1', updateFields: { customFields: { field: [{ key: '', value: 'West' }] } } },
		[],
	);

	await assert.rejects(
		handleContactOperations.call(context, 'updateContact', 0),
		/Choose a field for each Custom Fields entry/,
	);
	assert.equal(context.calls.length, 0);
});

test('updateContact with only an empty Custom Fields list fails before calling Streak', async () => {
	const context = createContext({ contactKey: 'contact_1', updateFields: { customFields: {} } }, []);

	await assert.rejects(
		handleContactOperations.call(context, 'updateContact', 0),
		/At least one field to update must be specified/,
	);
	assert.equal(context.calls.length, 0);
});

test('createContact sends domains and Instagram handle', async () => {
	const context = createContext(
		{
			teamKey: 'team_1',
			emailAddresses: ['jane@acme.example'],
			givenName: 'Jane',
			additionalFields: { domains: ['acme.example'], instagramHandle: 'jane' },
		},
		[{ key: 'contact_1' }],
	);

	await handleContactOperations.call(context, 'createContact', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/teams/team_1/contacts/');
	assert.deepEqual(request.body, {
		emailAddresses: ['jane@acme.example'],
		givenName: 'Jane',
		domains: ['acme.example'],
		instagramHandle: 'jane',
	});
});
