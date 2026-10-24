const assert = require('node:assert/strict');
const test = require('node:test');

const { handleOrganizationOperations } = require('../dist/nodes/Streak/operations/organizationOperations');
const { createContext } = require('./helpers');

test('createOrganization sends LinkedIn handle and logo URL under the names Streak stores', async () => {
	const context = createContext(
		{
			teamKey: 'team_1',
			name: 'Acme',
			additionalFields: { linkedInHandle: 'acme', logoUrl: 'https://acme.example/logo.png' },
		},
		[{ key: 'org_1' }],
	);

	await handleOrganizationOperations.call(context, 'createOrganization', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/teams/team_1/organizations');
	assert.deepEqual(request.body, {
		name: 'Acme',
		linkedinHandle: 'acme',
		logoURL: 'https://acme.example/logo.png',
	});
	// Return Existing If Found is off by default, so Streak always creates
	assert.equal(request.qs, undefined);
});

test('createOrganization with Return Existing If Found sends getIfExisting', async () => {
	const context = createContext(
		{ teamKey: 'team_1', name: 'Acme', getIfExisting: true, additionalFields: { domains: ['acme.example'] } },
		[{ key: 'org_existing' }],
	);

	const result = await handleOrganizationOperations.call(context, 'createOrganization', 0);

	assert.deepEqual(result, { key: 'org_existing' });
	const request = context.calls[0].requestOptions;
	assert.deepEqual(request.qs, { getIfExisting: true });
	assert.deepEqual(request.body, { name: 'Acme', domains: ['acme.example'] });
});

test('createOrganization accepts a domain without a name', async () => {
	const context = createContext(
		{ teamKey: 'team_1', name: '', additionalFields: { domains: ['acme.example'] } },
		[{ key: 'org_1' }],
	);

	await handleOrganizationOperations.call(context, 'createOrganization', 0);

	assert.deepEqual(context.calls[0].requestOptions.body, { domains: ['acme.example'] });
});

test('createOrganization without a name or a domain fails before calling Streak', async () => {
	const context = createContext({ teamKey: 'team_1', name: '', additionalFields: {} }, []);

	await assert.rejects(
		handleOrganizationOperations.call(context, 'createOrganization', 0),
		/Set a Name or at least one Domain/,
	);
	assert.equal(context.calls.length, 0);
});

test('updateOrganization sends LinkedIn handle and logo URL under the names Streak stores', async () => {
	const context = createContext(
		{ organizationKey: 'org_1', updateFields: { linkedInHandle: 'acme', logoUrl: 'https://acme.example/logo.png' } },
		[{ key: 'org_1' }],
	);

	await handleOrganizationOperations.call(context, 'updateOrganization', 0);

	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/organizations/org_1');
	assert.deepEqual(request.body, { linkedinHandle: 'acme', logoURL: 'https://acme.example/logo.png' });
});

test('updateOrganization with nothing Streak would store fails before calling Streak', async () => {
	// A saved workflow can still hold the removed Relationships option
	const context = createContext({ organizationKey: 'org_1', updateFields: { relationships: '[]' } }, []);

	await assert.rejects(
		handleOrganizationOperations.call(context, 'updateOrganization', 0),
		/At least one field to update must be specified/,
	);
	assert.equal(context.calls.length, 0);
});
