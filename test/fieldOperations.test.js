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

test('listFieldValues returns every value from one request with no paging parameters', async () => {
	const fieldValues = Array.from({ length: 60 }, (_, i) => ({ key: String(1001 + i), value: i }));
	const context = createContext({ boxKey: { mode: 'list', value: 'box_1' } }, [fieldValues]);

	const result = await handleFieldOperations.call(context, 'listFieldValues', 0);

	assert.deepEqual(result, fieldValues);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1/fields');
	assert.equal(request.qs, undefined);
});
