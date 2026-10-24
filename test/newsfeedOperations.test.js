const assert = require('node:assert/strict');
const test = require('node:test');

const { handleNewsfeedOperations } = require('../dist/nodes/Streak/operations/newsfeedOperations');
const { createContext } = require('./helpers');

const events = Array.from({ length: 60 }, (_, i) => ({ timestamp: 1000 - i }));

const cases = [
	{
		operation: 'getPipelineNewsfeed',
		parameters: { pipelineKey: 'pipe_1', detailLevel: 'CONDENSED' },
		url: 'https://api.streak.com/api/v1/pipelines/pipe_1/newsfeed',
		detailLevel: 'CONDENSED',
	},
	{
		operation: 'getBoxNewsfeed',
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		url: 'https://api.streak.com/api/v1/boxes/box_1/newsfeed',
		detailLevel: 'ALL',
	},
	{
		operation: 'getAllNewsfeed',
		parameters: {},
		url: 'https://api.streak.com/api/v1/newsfeed',
		detailLevel: 'ALL',
	},
];

for (const { operation, parameters, url, detailLevel } of cases) {
	test(`${operation} with default options asks Streak for page 0 of 50 events`, async () => {
		const context = createContext(parameters, [events.slice(0, 50)]);

		const result = await handleNewsfeedOperations.call(context, operation, 0);

		assert.deepEqual(result, events.slice(0, 50));
		assert.equal(context.calls.length, 1);
		const request = context.calls[0].requestOptions;
		assert.equal(request.url, url);
		assert.deepEqual(request.qs, { detailLevel, page: 0, limit: 50 });
	});

	test(`${operation} with Page N asks Streak for page N with the given limit`, async () => {
		const context = createContext({ ...parameters, returnAll: false, limit: 5, page: 2 }, [events.slice(10, 15)]);

		const result = await handleNewsfeedOperations.call(context, operation, 0);

		assert.deepEqual(result, events.slice(10, 15));
		assert.deepEqual(context.calls[0].requestOptions.qs, { detailLevel, page: 2, limit: 5 });
	});

	test(`${operation} with Return All makes one request without a limit`, async () => {
		const context = createContext({ ...parameters, returnAll: true, limit: 5 }, [events]);

		const result = await handleNewsfeedOperations.call(context, operation, 0);

		assert.deepEqual(result, events);
		assert.equal(context.calls.length, 1);
		assert.deepEqual(context.calls[0].requestOptions.qs, { detailLevel });
	});
}
