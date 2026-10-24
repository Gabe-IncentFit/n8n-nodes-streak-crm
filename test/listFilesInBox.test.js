const assert = require('node:assert/strict');
const test = require('node:test');

const { handleFileOperations } = require('../dist/nodes/Streak/operations/fileOperations');
const { createContext } = require('./helpers');

// v1 answers a paged request with a bare array, without hasNextPage
const files = Array.from({ length: 60 }, (_, i) => ({ fileKey: `file_${i}` }));
const box = { boxKey: { mode: 'list', value: 'box_1' } };

test('listFilesInBox with default options asks Streak for page 0 of 50 files', async () => {
	const context = createContext(box, [files.slice(0, 50)]);

	const result = await handleFileOperations.call(context, 'listFilesInBox', 0);

	assert.deepEqual(result, files.slice(0, 50));
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.url, 'https://api.streak.com/api/v1/boxes/box_1/files');
	assert.deepEqual(request.qs, { page: 0, limit: 50 });
});

test('listFilesInBox with Page N asks Streak for page N with the given limit', async () => {
	const context = createContext({ ...box, returnAll: false, limit: 5, page: 2 }, [files.slice(10, 15)]);

	const result = await handleFileOperations.call(context, 'listFilesInBox', 0);

	assert.deepEqual(result, files.slice(10, 15));
	assert.deepEqual(context.calls[0].requestOptions.qs, { page: 2, limit: 5 });
});

test('listFilesInBox with Return All makes one unpaged request and ignores Page and Limit', async () => {
	const context = createContext({ ...box, returnAll: true, limit: 5, page: 3 }, [files]);

	const result = await handleFileOperations.call(context, 'listFilesInBox', 0);

	assert.deepEqual(result, files);
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.qs, undefined);
});
