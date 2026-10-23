const assert = require('node:assert/strict');
const test = require('node:test');

const { handleThreadOperations } = require('../dist/nodes/Streak/operations/threadOperations');
const { handleFileOperations } = require('../dist/nodes/Streak/operations/fileOperations');
const { handleSnippetOperations } = require('../dist/nodes/Streak/operations/snippetOperations');
const { handleCommentOperations } = require('../dist/nodes/Streak/operations/commentOperations');
const { handleNewsfeedOperations } = require('../dist/nodes/Streak/operations/newsfeedOperations');
const { createContext } = require('./helpers');

// More than Limit's old default of 50, so any leftover cap would show up
const items = Array.from({ length: 60 }, (_, i) => ({ key: `item_${i}` }));

// Streak doesn't page these endpoints: each should make one GET with no page/limit and return every result
const cases = [
	{
		operation: 'listThreadsInBox',
		handler: handleThreadOperations,
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		response: items,
		url: 'https://api.streak.com/api/v1/boxes/box_1/threads',
		qs: undefined,
	},
	{
		operation: 'listFilesInBox',
		handler: handleFileOperations,
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		response: items,
		url: 'https://api.streak.com/api/v1/boxes/box_1/files',
		qs: undefined,
	},
	{
		operation: 'listSnippets',
		handler: handleSnippetOperations,
		parameters: {},
		response: items,
		url: 'https://api.streak.com/api/v1/snippets',
		qs: undefined,
	},
	{
		operation: 'listCommentsInBox',
		handler: handleCommentOperations,
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		response: { hasNextPage: false, results: items },
		url: 'https://api.streak.com/api/v2/boxes/box_1/comments',
		qs: undefined,
	},
	{
		operation: 'getPipelineNewsfeed',
		handler: handleNewsfeedOperations,
		parameters: { pipelineKey: 'pipe_1', detailLevel: 'CONDENSED' },
		response: items,
		url: 'https://api.streak.com/api/v1/pipelines/pipe_1/newsfeed',
		qs: { detailLevel: 'CONDENSED' },
	},
	{
		operation: 'getBoxNewsfeed',
		handler: handleNewsfeedOperations,
		parameters: { boxKey: { mode: 'list', value: 'box_1' } },
		response: items,
		url: 'https://api.streak.com/api/v1/boxes/box_1/newsfeed',
		qs: { detailLevel: 'ALL' },
	},
	{
		operation: 'getAllNewsfeed',
		handler: handleNewsfeedOperations,
		parameters: {},
		response: items,
		url: 'https://api.streak.com/api/v1/newsfeed',
		qs: { detailLevel: 'ALL' },
	},
];

for (const { operation, handler, parameters, response, url, qs } of cases) {
	test(`${operation} returns every result from one request with no paging parameters`, async () => {
		const context = createContext(parameters, [response]);

		const result = await handler.call(context, operation, 0);

		assert.deepEqual(result, items);
		assert.equal(context.calls.length, 1);
		const request = context.calls[0].requestOptions;
		assert.equal(request.method, 'GET');
		assert.equal(request.url, url);
		assert.deepEqual(request.qs, qs);
	});
}
