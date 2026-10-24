const assert = require('node:assert/strict');
const test = require('node:test');

const { StreakTrigger } = require('../dist/nodes/Streak/StreakTrigger.node');

const WEBHOOK_URL = 'https://n8n.example.com/webhook/abc/webhook';

function createHookContext(parameters, responses, staticData = {}) {
	const calls = [];

	return {
		calls,
		staticData,
		getNode() {
			return { name: 'Streak Trigger' };
		},
		getNodeParameter(name, defaultValue) {
			return Object.prototype.hasOwnProperty.call(parameters, name)
				? parameters[name]
				: defaultValue;
		},
		getNodeWebhookUrl() {
			return WEBHOOK_URL;
		},
		getWorkflowStaticData() {
			return staticData;
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

const { create, checkExists } = new StreakTrigger().webhookMethods.default;

test('create sends a team webhook with teamKey as a query parameter', async () => {
	const context = createHookContext(
		{ scope: 'team', teamKey: 'team_1', event: 'ORG_CREATE' },
		[{ key: 'wh_1' }],
	);

	const created = await create.call(context);

	assert.equal(created, true);
	assert.equal(context.staticData.webhookKey, 'wh_1');
	assert.equal(context.calls.length, 1);
	const request = context.calls[0].requestOptions;
	assert.equal(request.method, 'POST');
	assert.equal(request.url, 'https://api.streak.com/api/v2/webhooks');
	assert.deepEqual(request.qs, { teamKey: 'team_1' });
	assert.deepEqual(request.body, { event: 'ORG_CREATE', targetUrl: WEBHOOK_URL });
});

test('create sends a pipeline webhook with pipelineKey as a query parameter', async () => {
	const context = createHookContext(
		{ scope: 'pipeline', pipelineKey: 'pipe_1', event: 'BOX_CREATE' },
		[{ key: 'wh_2' }],
	);

	await create.call(context);

	const request = context.calls[0].requestOptions;
	assert.deepEqual(request.qs, { pipelineKey: 'pipe_1' });
	assert.deepEqual(request.body, { event: 'BOX_CREATE', targetUrl: WEBHOOK_URL });
});

test('create rejects a team event on a pipeline webhook before calling Streak', async () => {
	const context = createHookContext(
		{ scope: 'pipeline', pipelineKey: 'pipe_1', event: 'ORG_CREATE' },
		[],
	);

	await assert.rejects(create.call(context), /"Org Create" is a team event\. Set Scope to Team/);
	assert.equal(context.calls.length, 0);
});

test('create rejects a pipeline event on a team webhook before calling Streak', async () => {
	const context = createHookContext({ scope: 'team', teamKey: 'team_1', event: 'BOX_CREATE' }, []);

	await assert.rejects(
		create.call(context),
		/"Box Create" is a pipeline event\. Set Scope to Pipeline/,
	);
	assert.equal(context.calls.length, 0);
});

test('checkExists finds a matching webhook in Streak\'s { results } list and reuses it', async () => {
	const context = createHookContext({ scope: 'team', teamKey: 'team_1', event: 'ORG_CREATE' }, [
		{
			results: [
				{ key: 'wh_other_event', event: 'ORG_UPDATE', targetUrl: WEBHOOK_URL },
				{ key: 'wh_match', event: 'ORG_CREATE', targetUrl: WEBHOOK_URL },
			],
		},
	]);

	const exists = await checkExists.call(context);

	assert.equal(exists, true);
	assert.equal(context.staticData.webhookKey, 'wh_match');
	assert.equal(context.calls.length, 1);
	assert.equal(context.calls[0].requestOptions.url, 'https://api.streak.com/api/v2/teams/team_1/webhooks');
});

test('checkExists returns false when no webhook in { results } matches the URL and event', async () => {
	const context = createHookContext(
		{ scope: 'pipeline', pipelineKey: 'pipe_1', event: 'BOX_CREATE' },
		[
			{
				results: [
					{ key: 'wh_other_url', event: 'BOX_CREATE', targetUrl: 'https://elsewhere.example.com/hook' },
				],
			},
		],
	);

	const exists = await checkExists.call(context);

	assert.equal(exists, false);
	assert.equal(context.staticData.webhookKey, undefined);
	assert.equal(
		context.calls[0].requestOptions.url,
		'https://api.streak.com/api/v2/pipelines/pipe_1/webhooks',
	);
});

test('getTeamOptions lists teams from Streak\'s { results } response', async () => {
	const context = createHookContext({}, [
		{
			hasNextPage: false,
			results: [
				{ key: 'team_1', name: 'IncentFit' },
				{ key: 'team_2', name: 'Partners' },
			],
		},
	]);

	const options = await new StreakTrigger().methods.loadOptions.getTeamOptions.call(context);

	assert.deepEqual(options, [
		{ name: 'IncentFit (team_1)', value: 'team_1' },
		{ name: 'Partners (team_2)', value: 'team_2' },
	]);
	assert.equal(context.calls[0].requestOptions.url, 'https://api.streak.com/api/v2/users/me/teams');
});
