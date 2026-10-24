const assert = require('node:assert/strict');
const test = require('node:test');

const { handleFieldOperations } = require('../dist/nodes/Streak/operations/fieldOperations');
const { createContext } = require('./helpers');

test('listFields returns every field from one request with no paging parameters', async () => {
	const fields = Array.from({ length: 60 }, (_, i) => ({ key: String(1001 + i), name: `Field ${i}` }));
	const context = createContext({ pipelineKey: { mode: 'list', value: 'pipe_1' } }, [fields]);

	const result = await handleFieldOperations.call(context, 'listFields', 0);

	assert.deepEqual(result, fields);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields');
	assert.equal(request.qs, undefined);
});

// v1 answers a paged request with a bare array, without hasNextPage
const fieldValues = Array.from({ length: 60 }, (_, i) => ({ key: String(1001 + i), value: i }));
const box = { boxKey: { mode: 'list', value: 'box_1' } };

test('listFieldValues with default options asks Streak for page 0 of 50 values', async () => {
	const context = createContext(box, [fieldValues.slice(0, 50)]);

	const result = await handleFieldOperations.call(context, 'listFieldValues', 0);

	assert.deepEqual(result, fieldValues.slice(0, 50));
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1/fields');
	assert.deepEqual(request.qs, { page: 0, limit: 50 });
});

test('listFieldValues with Page N asks Streak for page N with the given limit', async () => {
	const context = createContext({ ...box, returnAll: false, limit: 5, page: 2 }, [fieldValues.slice(10, 15)]);

	const result = await handleFieldOperations.call(context, 'listFieldValues', 0);

	assert.deepEqual(result, fieldValues.slice(10, 15));
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 5 });
});

test('listFieldValues with Return All makes one unpaged request and ignores Page and Limit', async () => {
	const context = createContext({ ...box, returnAll: true, limit: 5, page: 3 }, [fieldValues]);

	const result = await handleFieldOperations.call(context, 'listFieldValues', 0);

	assert.deepEqual(result, fieldValues);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1/fields');
	assert.equal(request.qs, undefined);
});

test('listFieldValues rejects a negative Page without calling Streak', async () => {
	const context = createContext({ ...box, returnAll: false, page: -1 }, []);

	await assert.rejects(
		handleFieldOperations.call(context, 'listFieldValues', 0),
		/Page must be a whole number of 0 or more/,
	);
	assert.equal(context.calls.length, 0);
});
