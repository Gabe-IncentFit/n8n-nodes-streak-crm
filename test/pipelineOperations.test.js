const assert = require('node:assert/strict');
const test = require('node:test');

const { handlePipelineOperations } = require('../dist/nodes/Streak/operations/pipelineOperations');
const { createContext } = require('./helpers');

// v1 answers a paged request with a bare array, without hasNextPage
const pipelines = Array.from({ length: 60 }, (_, i) => ({ key: `pipe_${i}` }));

test('listAllPipelines with default options asks Streak for page 0 of 50 pipelines', async () => {
	const context = createContext({}, [pipelines.slice(0, 50)]);

	const result = await handlePipelineOperations.call(context, 'listAllPipelines', 0);

	assert.deepEqual(result, pipelines.slice(0, 50));
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'GET');
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines');
	assert.deepEqual(request.qs, { page: 0, limit: 50 });
});

test('listAllPipelines with Page N asks Streak for page N with the given limit', async () => {
	const context = createContext({ returnAll: false, limit: 5, page: 2 }, [pipelines.slice(10, 15)]);

	const result = await handlePipelineOperations.call(context, 'listAllPipelines', 0);

	assert.deepEqual(result, pipelines.slice(10, 15));
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 5 });
});

test('listAllPipelines with Return All makes one unpaged request and ignores Page and Limit', async () => {
	const context = createContext({ returnAll: true, limit: 5, page: 3 }, [pipelines]);

	const result = await handlePipelineOperations.call(context, 'listAllPipelines', 0);

	assert.deepEqual(result, pipelines);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines');
	assert.equal(request.qs, undefined);
});

test('listAllPipelines rejects a negative Page without calling Streak', async () => {
	const context = createContext({ returnAll: false, page: -1 }, []);

	await assert.rejects(
		handlePipelineOperations.call(context, 'listAllPipelines', 0),
		/Page must be a whole number of 0 or more/,
	);
	assert.equal(context.calls.length, 0);
});
