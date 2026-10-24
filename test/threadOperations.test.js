const assert = require('node:assert/strict');
const test = require('node:test');

const { handleThreadOperations } = require('../dist/nodes/Streak/operations/threadOperations');
const { createContext } = require('./helpers');

const threads = Array.from({ length: 60 }, (_, i) => ({ key: `thread_${i}` }));
const box = { boxKey: { mode: 'list', value: 'box_1' } };

test('listThreadsInBox without Return All sends Limit (default 50) and no page', async () => {
	const context = createContext(box, [threads.slice(0, 50)]);

	const result = await handleThreadOperations.call(context, 'listThreadsInBox', 0);

	assert.deepEqual(result, threads.slice(0, 50));
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1/threads');
	assert.deepEqual(request.qs, { limit: 50 });
});

test('listThreadsInBox with Return All makes one request without a limit', async () => {
	const context = createContext({ ...box, returnAll: true, limit: 5 }, [threads]);

	const result = await handleThreadOperations.call(context, 'listThreadsInBox', 0);

	assert.deepEqual(result, threads);
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.qs, undefined);
});
