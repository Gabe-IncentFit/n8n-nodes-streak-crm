const assert = require('node:assert/strict');
const test = require('node:test');

const { getFileContents } = require('../dist/nodes/Streak/operations/fileContents');
const { createContext } = require('./helpers');

function contextFor(parameters, responses) {
	const context = createContext(parameters, responses);
	context.helpers.prepareBinaryData = async (buffer, fileName, mimeType) => ({
		data: buffer.toString('base64'),
		fileName,
		mimeType,
	});
	return context;
}

const metadata = { key: 'file_1', fileType: 'GMAIL_API', fileName: 'logo.png', mimeType: 'image/png' };
// Not valid UTF-8, like the PNG Streak returned live
const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x00]);

test('getFileContents downloads the raw bytes and outputs them as binary data, with the metadata as JSON', async () => {
	const context = contextFor({ fileKey: 'file_1' }, [
		metadata,
		{ body: pngBytes, headers: { 'content-type': 'image/png' } },
	]);

	const item = await getFileContents.call(context, 0);

	assert.deepEqual(item.json, metadata);
	assert.deepEqual(item.binary.data, { data: pngBytes.toString('base64'), fileName: 'logo.png', mimeType: 'image/png' });
	const [meta, contents] = context.calls.map((c) => c.requestOptions);
	assert.equal(meta.url, 'https://api.streak.com/api/v1/files/file_1');
	assert.equal(contents.url, 'https://api.streak.com/api/v1/files/file_1/contents');
	assert.equal(contents.encoding, 'arraybuffer');
	assert.equal(contents.json, false);
	assert.equal(contents.returnFullResponse, true);
});

test('getFileContents puts the file in the chosen field and falls back to the metadata type', async () => {
	const context = contextFor({ fileKey: 'file_1', binaryPropertyName: 'attachment' }, [
		metadata,
		{ body: pngBytes, headers: {} },
	]);

	const item = await getFileContents.call(context, 0);

	assert.deepEqual(Object.keys(item.binary), ['attachment']);
	assert.equal(item.binary.attachment.mimeType, 'image/png');
});
