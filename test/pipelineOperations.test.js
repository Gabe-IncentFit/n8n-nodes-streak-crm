const assert = require('node:assert/strict');
const test = require('node:test');

const { handlePipelineOperations } = require('../dist/nodes/Streak/operations/pipelineOperations');
const { createContext } = require('./helpers');

test('listAllPipelines returns every pipeline from one request with no paging parameters', async () => {
	const pipelines = Array.from({ length: 60 }, (_, i) => ({ key: `pipe_${i}` }));
	const context = createContext({}, [pipelines]);

	const result = await handlePipelineOperations.call(context, 'listAllPipelines', 0);

	assert.deepEqual(result, pipelines);
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'GET');
	assert.equal(request.url, 'https://api.streak.com/api/v1/pipelines');
	assert.equal(request.qs, undefined);
});
