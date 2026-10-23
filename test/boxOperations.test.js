const assert = require('node:assert/strict');
const test = require('node:test');

const { handleBoxOperations } = require('../dist/nodes/Streak/operations/boxOperations');
const { createContext } = require('./helpers');

test('createBox sends email-object assignment entries', async () => {
	const context = createContext(
		{
			pipelineKey: { mode: 'list', value: 'pipe_1' },
			boxName: 'New Deal',
			stageKey: '',
			additionalFields: {
				assignedToSharingEntries: ['ada@example.com', 'grace@example.com'],
			},
		},
		[{ key: 'box_1' }],
	);

	await handleBoxOperations.call(context, 'createBox', 0);

	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v2/pipelines/pipe_1/boxes');
	assert.deepEqual(request.body.assignedToSharingEntries, [
		{ email: 'ada@example.com' },
		{ email: 'grace@example.com' },
	]);
});

test('updateBox sends email-object assignment entries', async () => {
	const context = createContext(
		{
			boxKey: 'box_1',
			updateFields: {
				assignedToSharingEntries: ['ada@example.com', 'grace@example.com'],
			},
		},
		[{ key: 'box_1' }],
	);

	await handleBoxOperations.call(context, 'updateBox', 0);

	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1');
	assert.deepEqual(request.body.assignedToSharingEntries, [
		{ email: 'ada@example.com' },
		{ email: 'grace@example.com' },
	]);
});

test('getTimeline sends filters in Streak bracket format', async () => {
	const context = createContext(
		{
			boxKey: 'box_1',
			direction: 'Descending',
			timelineFilters: ['CALL_LOGS', 'COMMENTS'],
			startTimestamp: '',
			returnAll: false,
			limit: 25,
		},
		[{ entries: [{ key: 'entry_1' }] }],
	);

	const result = await handleBoxOperations.call(context, 'getTimeline', 0);

	assert.deepEqual(result, [{ key: 'entry_1' }]);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.deepEqual(request.qs, {
		direction: 'Descending',
		filters: '[CALL_LOGS,COMMENTS]',
		limit: 25,
	});
});

test('listBoxes flattens paginated results and follows hasNextPage', async () => {
	const context = createContext(
		{
			pipelineKey: { mode: 'list', value: 'pipe_1' },
			stageKeyFilter: '',
			searchQuery: '',
			sortBy: 'lastUpdatedTimestamp',
			returnAll: true,
			limit: 50,
		},
		[
			{ results: [{ key: 'box_1' }], hasNextPage: true },
			{ results: [{ key: 'box_2' }], hasNextPage: false },
		],
	);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'box_1' }, { key: 'box_2' }]);
	assert.equal(context.calls.length, 2);
	assert.deepEqual(context.calls.map((call) => call.requestOptions.qs.page), [0, 1]);
	assert.deepEqual(context.calls.map((call) => call.requestOptions.qs.limit), [100, 100]);
});

const listBoxesParameters = {
	pipelineKey: { mode: 'list', value: 'pipe_1' },
	stageKeyFilter: { mode: 'list', value: '5001' },
	searchQuery: '',
	sortBy: 'creationTimestamp',
	returnAll: false,
	limit: 25,
};

test('listBoxes without Page fetches page 0 with sortBy and stageKey', async () => {
	const context = createContext(listBoxesParameters, [
		{ results: [{ key: 'box_1' }], hasNextPage: true },
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'box_1' }]);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/boxes');
	assert.deepEqual(request.qs, {
		stageKey: '5001',
		sortBy: 'creationTimestamp',
		page: 0,
		limit: 25,
	});
});

test('listBoxes with Page N fetches only page N with the given limit, sortBy and stageKey', async () => {
	const context = createContext({ ...listBoxesParameters, page: 3, limit: 100 }, [
		{ results: [{ key: 'box_301' }, { key: 'box_302' }], hasNextPage: true },
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'box_301' }, { key: 'box_302' }]);
	// hasNextPage is true, but without Return All only the requested page is fetched
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.qs, {
		stageKey: '5001',
		sortBy: 'creationTimestamp',
		page: 3,
		limit: 100,
	});
});

test('listBoxes with Return All starts at page 0 and ignores Page', async () => {
	const context = createContext({ ...listBoxesParameters, returnAll: true, page: 5 }, [
		{ results: [{ key: 'box_1' }], hasNextPage: true },
		{ results: [{ key: 'box_2' }], hasNextPage: false },
	]);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	assert.deepEqual(result, [{ key: 'box_1' }, { key: 'box_2' }]);
	assert.deepEqual(
		context.calls.map((call) => call.requestOptions.qs),
		[
			{ stageKey: '5001', sortBy: 'creationTimestamp', page: 0, limit: 100 },
			{ stageKey: '5001', sortBy: 'creationTimestamp', page: 1, limit: 100 },
		],
	);
});

test('listBoxes rejects Page above 0 with Search Query instead of repeating page 0', async () => {
	const context = createContext({ ...listBoxesParameters, searchQuery: 'acme', page: 1 }, []);

	await assert.rejects(
		handleBoxOperations.call(context, 'listBoxes', 0),
		/Page is not supported together with Search Query/,
	);
	assert.equal(context.calls.length, 0);
});

test('listBoxes with Search Query and Page 0 still searches and applies Limit', async () => {
	const context = createContext(
		{ ...listBoxesParameters, searchQuery: 'acme', page: 0, limit: 1 },
		[
			{ results: { boxes: [{ boxKey: 'box_a' }, { boxKey: 'box_b' }] } },
			[{ key: 'box_a', name: 'Acme' }],
		],
	);

	const result = await handleBoxOperations.call(context, 'listBoxes', 0);

	// Search finds the keys, Limit trims them, then only those boxes are fetched in full
	assert.deepEqual(result, [{ key: 'box_a', name: 'Acme' }]);
	assert.equal(context.calls.length, 2);
	const search = context.calls[0].requestOptions;
	assert.equal(search.url, 'https://api.streak.com/api/v1/search');
	assert.equal(search.qs.page, 0);
	const batch = context.calls[1].requestOptions;
	assert.equal(batch.url, 'https://api.streak.com/api/v2/pipelines/pipe_1/boxes/batch/get');
	assert.deepEqual(batch.body, ['box_a']);
});

for (const page of [-1, 1.5]) {
	test(`listBoxes rejects Page ${page} before calling Streak`, async () => {
		const context = createContext({ ...listBoxesParameters, page }, []);

		await assert.rejects(
			handleBoxOperations.call(context, 'listBoxes', 0),
			/Page must be a whole number of 0 or more/,
		);
		assert.equal(context.calls.length, 0);
	});
}
