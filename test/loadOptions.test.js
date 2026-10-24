const assert = require('node:assert/strict');
const test = require('node:test');

const { listSearch, loadOptions } = require('../dist/nodes/Streak/methods/loadOptions');
const { createContext } = require('./helpers');

test('the Box picker reads the boxes out of the wrapped v2 response and filters them by name', async () => {
	const context = createContext({}, [
		{
			results: [
				{ key: 'box_1', name: 'Acme renewal' },
				{ key: 'box_2', name: 'Globex' },
			],
			hasNextPage: false,
		},
	]);
	context.getCurrentNodeParameter = (name) => (name === 'pipelineKey' ? { mode: 'list', value: 'pipe_1' } : undefined);

	const result = await listSearch.getBoxOptions.call(context, 'acme');

	assert.equal(context.calls[0].requestOptions.url, 'https://api.streak.com/api/v2/pipelines/pipe_1/boxes');
	assert.deepEqual(result.results.map((r) => r.value), ['box_1']);
});

test('the custom contact field picker lists the fields of every team, skips formulas and names the team when there are several', async () => {
	const context = createContext({}, [
		{
			results: [
				{ key: 'team_1', name: 'Sales' },
				{ key: 'team_2', name: 'Support' },
			],
		},
		{
			1001: { key: '1001', name: 'Region', type: 'TEXT_INPUT' },
			1002: { key: '1002', name: 'Score', type: 'FORMULA' },
		},
		{
			3001: { key: '3001', name: 'Tier', type: 'DROPDOWN' },
		},
	]);

	const options = await loadOptions.getContactFieldOptions.call(context);

	assert.deepEqual(
		context.calls.map((call) => call.requestOptions.url),
		[
			'https://api.streak.com/api/v2/users/me/teams',
			'https://api.streak.com/api/v2/teams/team_1/contacts/fields',
			'https://api.streak.com/api/v2/teams/team_2/contacts/fields',
		],
	);
	assert.deepEqual(options, [
		{ name: 'Region (TEXT_INPUT, Sales)', value: '1001' },
		{ name: 'Tier (DROPDOWN, Support)', value: '3001' },
	]);
});

test('the custom organization field picker reads organization fields and leaves the team out with one team', async () => {
	const context = createContext({}, [
		{ results: [{ key: 'team_1', name: 'Sales' }] },
		{ 2001: { key: '2001', name: 'Segment', type: 'TEXT_INPUT' } },
	]);

	const options = await loadOptions.getOrganizationFieldOptions.call(context);

	assert.equal(
		context.calls[1].requestOptions.url,
		'https://api.streak.com/api/v2/teams/team_1/organizations/fields',
	);
	assert.deepEqual(options, [{ name: 'Segment (TEXT_INPUT)', value: '2001' }]);
});
