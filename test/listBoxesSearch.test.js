const assert = require('node:assert/strict');
const test = require('node:test');

const { handleBoxOperations } = require('../dist/nodes/Streak/operations/boxOperations');
const { createContext } = require('./helpers');

const searchParameters = { pipelineKey: { mode: 'list', value: 'pipe_1' }, searchQuery: 'acme' };
const searchPage = (...keys) => ({ results: { boxes: keys.map((boxKey) => ({ boxKey, name: boxKey })) } });

test('listBoxes with a Search Query and Return All pages through the search, then fetches the full boxes in search order', async () => {
	const context = createContext({ ...searchParameters, returnAll: true }, [
		searchPage('b1', 'b2'),
		searchPage('b3'),
		searchPage(),
		// The batch endpoint doesn't promise any order
		[{ key: 'b3', fields: {} }, { key: 'b1', fields: {} }, { key: 'b2', fields: {} }],
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result.map((box) => box.key), ['b1', 'b2', 'b3']);
	assert.equal(context.calls.length, 4);
	const searches = context.calls.slice(0, 3).map((c) => c.requestOptions);
	assert.deepEqual(searches.map((r) => r.qs.page), [0, 1, 2]);
	assert.deepEqual(searches[0].qs, { query: 'acme', pipelineKey: 'pipe_1', page: 0 });
	const batch = context.calls[3].requestOptions;
	assert.equal(batch.method, 'POST');
	assert.equal(batch.url, 'https://api.streak.com/api/v2/pipelines/pipe_1/boxes/batch/get');
	assert.deepEqual(batch.body, ['b1', 'b2', 'b3']);
});

test('listBoxes with a Search Query and Return All stops when a page repeats boxes it already has', async () => {
	const context = createContext({ ...searchParameters, returnAll: true }, [
		searchPage('b1', 'b2'),
		searchPage('b1', 'b2'),
		{ results: [{ key: 'b1' }, { key: 'b2' }] },
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'b1' }, { key: 'b2' }]);
	assert.equal(context.calls.length, 3);
});

test('listBoxes with a Search Query and Limit fetches one search page and the first Limit boxes', async () => {
	const context = createContext({ ...searchParameters, returnAll: false, limit: 2 }, [
		searchPage('b1', 'b2', 'b3'),
		[{ key: 'b1' }, { key: 'b2' }],
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'b1' }, { key: 'b2' }]);
	assert.equal(context.calls.length, 2);
	assert.deepEqual(context.calls[1].requestOptions.body, ['b1', 'b2']);
});

test('listBoxes with a Search Query that matches nothing returns no boxes after one request', async () => {
	const context = createContext({ ...searchParameters, returnAll: true }, [searchPage()]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, []);
	assert.equal(context.calls.length, 1);
});
