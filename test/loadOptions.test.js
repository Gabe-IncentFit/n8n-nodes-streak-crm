const assert = require('node:assert/strict');
const test = require('node:test');

const { listSearch } = require('../dist/nodes/Streak/methods/loadOptions');
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
