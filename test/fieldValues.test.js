const assert = require('node:assert/strict');
const test = require('node:test');

const { handleFieldOperations } = require('../dist/nodes/Streak/operations/fieldOperations');
const { createContext } = require('./helpers');

const fieldDefs = [
	{ key: '1001', name: 'Done', type: 'CHECKBOX' },
	{ key: '1002', name: 'Labels', type: 'TAG', tagSettings: { tags: [{ key: '9001', tag: 'hot' }, { key: '9002', tag: 'cold' }] } },
	{ key: '1003', name: 'Priority', type: 'DROPDOWN', dropdownSettings: { items: [{ key: '9001', name: 'High' }, { key: '9002', name: 'Low' }] } },
	{ key: '1004', name: 'Close date', type: 'DATE' },
	{ key: '1005', name: 'Notes', type: 'TEXT_INPUT' },
];

function updateValue(fieldKey, fieldValue) {
	const context = createContext(
		{ boxKey: { mode: 'list', value: 'box_1' }, fieldKey, fieldValue },
		// The box (for its pipeline), the pipeline's fields, then the update itself
		[{ key: 'box_1', pipelineKey: 'pipe_1' }, fieldDefs, { key: fieldKey }],
	);
	return { context, run: () => handleFieldOperations.call(context, 'updateFieldValue', 0) };
}

const conversions = [
	['a checkbox, from "True"', '1001', 'True', true],
	['a checkbox, from "false"', '1001', 'false', false],
	['tags, from names and keys separated by commas', '1002', 'Hot, 9002', ['9001', '9002']],
	['a dropdown, from the option name in any case', '1003', 'low', '9002'],
	['a dropdown, from the option key', '1003', '9001', '9001'],
	['a date, from an ISO date', '1004', '2020-01-02T03:04:05Z', 1577934245000],
	['a date, from epoch milliseconds as text', '1004', '1577934245000', 1577934245000],
	['text, unchanged', '1005', 'hello', 'hello'],
];

for (const [label, fieldKey, input, expected] of conversions) {
	test(`updateFieldValue sends ${label}`, async () => {
		const { context, run } = updateValue(fieldKey, input);

		await run();

		assert.equal(context.calls.length, 3);
		assert.equal(context.calls[0].requestOptions.url, 'https://api.streak.com/api/v1/boxes/box_1');
		assert.equal(context.calls[1].requestOptions.url, 'https://api.streak.com/api/v1/pipelines/pipe_1/fields');
		const update = context.calls[2].requestOptions;
		assert.equal(update.method, 'POST');
		assert.equal(update.url, `https://api.streak.com/api/v1/boxes/box_1/fields/${fieldKey}`);
		assert.deepEqual(update.body, { value: expected });
	});
}

test('updateFieldValue rejects a checkbox value other than true or false', async () => {
	const { context, run } = updateValue('1001', 'yes');

	await assert.rejects(run(), /checkbox field, so its value must be true or false/);
	assert.equal(context.calls.length, 2);
});

test('updateFieldValue rejects a tag the field does not have', async () => {
	const { context, run } = updateValue('1002', 'hot, warm');

	await assert.rejects(run(), /has no tag "warm"/);
	assert.equal(context.calls.length, 2);
});

test('updateFieldValue sends a value that is already typed as is, without looking up the field', async () => {
	const context = createContext(
		{ boxKey: { mode: 'list', value: 'box_1' }, fieldKey: '1002', fieldValue: ['9001'] },
		[{ key: '1002' }],
	);

	await handleFieldOperations.call(context, 'updateFieldValue', 0);

	assert.equal(context.calls.length, 1);
	assert.deepEqual(context.calls[0].requestOptions.body, { value: ['9001'] });
});
