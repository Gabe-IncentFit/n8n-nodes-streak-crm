const assert = require('node:assert/strict');
const test = require('node:test');

const { handleFileOperations } = require('../dist/nodes/Streak/operations/fileOperations');

function createContext(parameters, responses) {
	const calls = [];

	return {
		calls,
		getNode() {
			return { name: 'Streak' };
		},
		getNodeParameter(name, _itemIndex, defaultValue) {
			return Object.prototype.hasOwnProperty.call(parameters, name)
				? parameters[name]
				: defaultValue;
		},
		helpers: {
			async httpRequestWithAuthentication(credentialsType, requestOptions) {
				calls.push({ credentialsType, requestOptions });
				if (responses.length === 0) {
					throw new Error(`Unexpected request to ${requestOptions.url}`);
				}
				return responses.shift();
			},
		},
		logger: {
			warn() {},
		},
	};
}

const attachedFile = [{ fileKey: 'file_1', driveFileId: 'drive_1', driveBoxKey: 'box_1' }];

function assertAddFileRequest(context) {
	assert.equal(context.calls.length, 1);
	const { credentialsType, requestOptions: request } = context.calls[0];
	assert.equal(credentialsType, 'streakApi');
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v2/files/');
	assert.equal(request.headers['Content-Type'], 'application/json');
	assert.equal(request.json, true);
	// Streak requires an array, even for one file
	assert.ok(Array.isArray(request.body));
	assert.equal(request.body.length, 1);
	assert.deepEqual(request.body, [{ driveFileId: 'drive_1', driveBoxKey: 'box_1' }]);
}

test('addFileToBox sends a one-element array with a plain string box key', async () => {
	const context = createContext({ boxKey: 'box_1', driveFileId: 'drive_1' }, [attachedFile]);

	const result = await handleFileOperations.call(context, 'addFileToBox', 0);

	assertAddFileRequest(context);
	assert.deepEqual(result, attachedFile);
});

test('addFileToBox sends a one-element array with a resource locator box key', async () => {
	const context = createContext(
		{ boxKey: { mode: 'list', value: 'box_1' }, driveFileId: 'drive_1' },
		[attachedFile],
	);

	const result = await handleFileOperations.call(context, 'addFileToBox', 0);

	assertAddFileRequest(context);
	assert.deepEqual(result, attachedFile);
});

for (const boxKey of ['', { mode: 'list', value: '' }]) {
	test(`addFileToBox rejects a missing box key (${JSON.stringify(boxKey)}) before calling Streak`, async () => {
		const context = createContext({ boxKey, driveFileId: 'drive_1' }, []);

		await assert.rejects(
			handleFileOperations.call(context, 'addFileToBox', 0),
			/Parameter boxKey is required for this operation/,
		);
		assert.equal(context.calls.length, 0);
	});
}

test('addFileToBox rejects a missing Drive file ID before calling Streak', async () => {
	const context = createContext({ boxKey: 'box_1', driveFileId: '' }, []);

	await assert.rejects(
		handleFileOperations.call(context, 'addFileToBox', 0),
		/Parameter driveFileId is required for this operation/,
	);
	assert.equal(context.calls.length, 0);
});

test('addFileToBox attaches several Drive files to the box in one request', async () => {
	const attached = [
		{ fileKey: 'file_1', driveFileId: 'drive_1' },
		{ fileKey: 'file_2', driveFileId: 'drive_2' },
		{ fileKey: 'file_3', driveFileId: 'drive_3' },
	];
	const context = createContext(
		// Commas, spaces, new lines, a blank entry and a repeat
		{ boxKey: 'box_1', driveFileId: 'drive_1, drive_2,\ndrive_3,, drive_2' },
		[attached],
	);

	const result = await handleFileOperations.call(context, 'addFileToBox', 0);

	assert.deepEqual(result, attached);
	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.body, [
		{ driveFileId: 'drive_1', driveBoxKey: 'box_1' },
		{ driveFileId: 'drive_2', driveBoxKey: 'box_1' },
		{ driveFileId: 'drive_3', driveBoxKey: 'box_1' },
	]);
});

test('addFileToBox accepts an array of Drive file IDs from an expression', async () => {
	const context = createContext(
		{ boxKey: { mode: 'list', value: 'box_1' }, driveFileId: ['drive_1', ' drive_2 '] },
		[[]],
	);

	await handleFileOperations.call(context, 'addFileToBox', 0);

	assert.deepEqual(context.calls[0].requestOptions.body, [
		{ driveFileId: 'drive_1', driveBoxKey: 'box_1' },
		{ driveFileId: 'drive_2', driveBoxKey: 'box_1' },
	]);
});

test('addFileToBox rejects Drive file IDs that are only separators', async () => {
	const context = createContext({ boxKey: 'box_1', driveFileId: ' ,\n, ' }, []);

	await assert.rejects(
		handleFileOperations.call(context, 'addFileToBox', 0),
		/Parameter driveFileId is required for this operation/,
	);
	assert.equal(context.calls.length, 0);
});
