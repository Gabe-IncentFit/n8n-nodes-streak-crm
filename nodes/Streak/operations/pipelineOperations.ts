import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import {
	streakApiRequest,
	streakApiFormRequest,
	validateParameters,
	fetchAllResults,
	getPageParameter,
	handlePagination,
} from './utils';

/**
 * Handle pipeline-related operations for the Streak API
 */
export async function handlePipelineOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle pipeline operations
	if (operation === 'listAllPipelines') {
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

		// Without page or limit, Streak returns every pipeline in one response
		if (returnAll) {
			return await fetchAllResults(this, '/pipelines', undefined, 'v1');
		}

		// v1 accepts page and limit, but its response is a bare array with no hasNextPage
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const page = getPageParameter.call(this, itemIndex);

		return await handlePagination(this, '/pipelines', false, limit, {}, 'v1', page);
	} else if (operation === 'getPipeline') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}`);
	} else if (operation === 'createPipeline') {
		const pipelineName = this.getNodeParameter('pipelineName', itemIndex) as string;
		const teamKeyParam = this.getNodeParameter('teamKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const teamKey = typeof teamKeyParam === 'string' ? teamKeyParam : teamKeyParam.value;

		// Get stages from the fixedCollection input and convert to comma-separated string
		const stagesInput = this.getNodeParameter('stages', itemIndex, { stage: [] }) as {
			stage: Array<{ name: string }>;
		};
		const stageNames = stagesInput.stage
			.map((stage) => stage.name)
			.filter((name) => name.trim() !== '')
			.join(',');

		// Get additional options
		const additionalOptions = this.getNodeParameter(
			'additionalOptions',
			itemIndex,
			{},
		) as IDataObject;
		const teamWide = additionalOptions.teamWide as boolean | undefined;

		// Process custom fields if provided
		let fieldNames = '';
		let fieldTypes = '';

		if (additionalOptions.customFields) {
			if (
				typeof additionalOptions.customFields === 'object' &&
				additionalOptions.customFields !== null &&
				'field' in additionalOptions.customFields &&
				Array.isArray((additionalOptions.customFields as { field: unknown }).field)
			) {
				const customFieldsInput = additionalOptions.customFields as {
					field: Array<{ name: string; type: string }>;
				};

				const fields = customFieldsInput.field.filter((field) => {
					return (
						field &&
						typeof field === 'object' &&
						typeof field.name === 'string' &&
						field.name.trim() !== '' &&
						typeof field.type === 'string' &&
						field.type.trim() !== ''
					);
				});

				if (fields.length > 0) {
					const names = fields.map((field) => field.name);
					const types = fields.map((field) => field.type);

					if (names.length === types.length) {
						fieldNames = names.join(',');
						fieldTypes = types.join(',');
					}
				}
			}
		}

		validateParameters.call(
			this,
			{ pipelineName, teamKey },
			['pipelineName', 'teamKey'],
			itemIndex,
		);

		const body: IDataObject = {
			name: pipelineName,
			teamKey,
		};

		if (stageNames) {
			body.stageNames = stageNames;
		}

		if (teamWide !== undefined) {
			body.teamWide = teamWide;
		}

		if (fieldNames) {
			body.fieldNames = fieldNames;
		}

		if (fieldTypes) {
			body.fieldTypes = fieldTypes;
		}

		return await streakApiFormRequest(this, 'PUT', '/pipelines', body);
	} else if (operation === 'updatePipeline') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		if (Object.keys(updateFields).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		const updateData: IDataObject = {};
		if (updateFields.name) updateData.name = updateFields.name;
		if (updateFields.description) updateData.description = updateFields.description;
		if (updateFields.orgWide !== undefined) updateData.orgWide = updateFields.orgWide;
		if (updateFields.teamKey) updateData.teamKey = updateFields.teamKey;

		return await streakApiRequest(this, 'POST', `/pipelines/${pipelineKey}`, updateData);
	} else if (operation === 'deletePipeline') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		return await streakApiRequest(this, 'DELETE', `/pipelines/${pipelineKey}`);
	} else if (operation === 'moveBoxesBatch') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		let boxKeysInput: string[] = [];
		const rawInput = this.getNodeParameter('boxKeys', itemIndex);

		if (typeof rawInput === 'string') {
			boxKeysInput = rawInput
				.split(',')
				.map((key) => key.trim())
				.filter(Boolean);
		} else if (Array.isArray(rawInput)) {
			boxKeysInput = rawInput.map((item) => String(item)).filter(Boolean);
		}
		const targetPipelineKeyParam = this.getNodeParameter('targetPipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const targetPipelineKey =
			typeof targetPipelineKeyParam === 'string'
				? targetPipelineKeyParam
				: targetPipelineKeyParam.value;

		validateParameters.call(
			this,
			{ pipelineKey, boxKeysInput, targetPipelineKey },
			['pipelineKey', 'boxKeysInput', 'targetPipelineKey'],
			itemIndex,
		);

		// Transform to Streak API v2 format: [{ key, boxKey, pipelineKey }, ...]
		const requestBody = boxKeysInput.map((boxKey) => ({
			key: boxKey,
			boxKey: boxKey,
			pipelineKey: targetPipelineKey,
		}));

		return await streakApiRequest(
			this,
			'POST',
			`/pipelines/${pipelineKey}/boxes/batch`,
			requestBody,
		);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The pipeline operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
