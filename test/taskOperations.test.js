const assert = require('node:assert/strict');
const test = require('node:test');

const { handleTaskOperations } = require('../dist/nodes/Streak/operations/taskOperations');
const { createContext } = require('./helpers');

const getTasksParameters = {
	boxKey: { mode: 'list', value: 'box_1' },
	returnAll: false,
	limit: 10,
};

test('getTasksInBox without Page fetches page 0 with the given limit', async () => {
	const context = createContext(getTasksParameters, [
		{ results: [{ key: 'task_1' }], hasNextPage: true },
	]);

	const result = await handleTaskOperations.call(context, 'getTasksInBox', 0);

	assert.deepEqual(result, [{ key: 'task_1' }]);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v2/boxes/box_1/tasks');
	assert.deepEqual(request.qs, { page: 0, limit: 10 });
});

test('getTasksInBox with Page N fetches page N with the given limit', async () => {
	const context = createContext({ ...getTasksParameters, page: 2 }, [
		{ results: [{ key: 'task_21' }], hasNextPage: true },
	]);

	const result = await handleTaskOperations.call(context, 'getTasksInBox', 0);

	assert.deepEqual(result, [{ key: 'task_21' }]);
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 10 });
});

test('getTasksInBox with Return All starts at page 0 and ignores Page', async () => {
	const context = createContext({ ...getTasksParameters, returnAll: true, page: 4 }, [
		{ results: [{ key: 'task_1' }], hasNextPage: true },
		{ results: [{ key: 'task_2' }], hasNextPage: false },
	]);

	const result = await handleTaskOperations.call(context, 'getTasksInBox', 0);

	assert.deepEqual(result, [{ key: 'task_1' }, { key: 'task_2' }]);
	assert.deepEqual(
		context.calls.map((call) => call.requestOptions.qs),
		[
			{ page: 0, limit: 100 },
			{ page: 1, limit: 100 },
		],
	);
});

test('getTasksInBox past the last page returns the empty-tasks placeholder', async () => {
	const context = createContext({ ...getTasksParameters, page: 7 }, [
		{ results: [], hasNextPage: false },
	]);

	const result = await handleTaskOperations.call(context, 'getTasksInBox', 0);

	assert.deepEqual(result, [{ tasks: [], count: 0 }]);
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 7, limit: 10 });
});
