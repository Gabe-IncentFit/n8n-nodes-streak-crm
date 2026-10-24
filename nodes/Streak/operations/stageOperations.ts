import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, streakApiFormRequest, validateParameters } from './utils';

/**
 * Streak stores a stage color as a background and a text color, and rejects a plain color
 * string. Use the chosen color as the background, with black or white text, whichever reads
 * better on it.
 */
function toStageColor(color: string): IDataObject {
	const hex = color.trim().replace(/^#/, '');
	const full = /^[0-9a-f]{3}$/i.test(hex) ? hex.replace(/./g, (c) => c + c) : hex;

	if (!/^[0-9a-f]{6}$/i.test(full)) {
		// Not a hex color (for example a CSS color name); send it as is with white text
		return { backgroundColor: color.trim(), foregroundColor: '#FFFFFF' };
	}

	const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
	// Perceived brightness (YIQ); light backgrounds get black text
	const foregroundColor = (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#000000' : '#FFFFFF';

	return { backgroundColor: `#${full.toUpperCase()}`, foregroundColor };
}

/**
 * Handle stage-related operations for the Streak API
 */
export async function handleStageOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle stage operations
	if (operation === 'listStages') {
		// List Stages operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		// Streak returns the stages as an object keyed by stage key; output one item per stage
		const stages = await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/stages`);
		return Array.isArray(stages) ? stages : (Object.values(stages || {}) as IDataObject[]);
	} else if (operation === 'getStage') {
		// Get Stage operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const stageKeyParam = this.getNodeParameter('stageKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const stageKey = typeof stageKeyParam === 'string' ? stageKeyParam : stageKeyParam.value;

		validateParameters.call(
			this,
			{ pipelineKey, stageKey },
			['pipelineKey', 'stageKey'],
			itemIndex,
		);

		return await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/stages/${stageKey}`);
	} else if (operation === 'createStage') {
		// Create Stage operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const stageName = this.getNodeParameter('stageName', itemIndex) as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(
			this,
			{ pipelineKey, stageName },
			['pipelineKey', 'stageName'],
			itemIndex,
		);

		const stage = (await streakApiFormRequest(this, 'PUT', `/pipelines/${pipelineKey}/stages`, {
			name: stageName,
		})) as IDataObject;

		if (!additionalFields.color) {
			return stage;
		}

		// The create call takes only a name, so the color is set by an update right after
		if (!stage?.key) {
			throw new NodeOperationError(
				this.getNode(),
				'Streak created the stage but returned no key, so its color could not be set',
				{ itemIndex },
			);
		}

		return await streakApiRequest(this, 'POST', `/pipelines/${pipelineKey}/stages/${stage.key}`, {
			color: toStageColor(additionalFields.color as string),
		});
	} else if (operation === 'updateStage') {
		// Update Stage operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const stageKeyParam = this.getNodeParameter('stageKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const stageKey = typeof stageKeyParam === 'string' ? stageKeyParam : stageKeyParam.value;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(
			this,
			{ pipelineKey, stageKey },
			['pipelineKey', 'stageKey'],
			itemIndex,
		);

		if (Object.keys(updateFields).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		if (updateFields.name) {
			body.name = updateFields.name;
		}

		if (updateFields.color) {
			body.color = toStageColor(updateFields.color as string);
		}

		return await streakApiRequest(this, 'POST', `/pipelines/${pipelineKey}/stages/${stageKey}`, body);
	} else if (operation === 'deleteStage') {
		// Delete Stage operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const stageKeyParam = this.getNodeParameter('stageKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const stageKey = typeof stageKeyParam === 'string' ? stageKeyParam : stageKeyParam.value;

		validateParameters.call(
			this,
			{ pipelineKey, stageKey },
			['pipelineKey', 'stageKey'],
			itemIndex,
		);

		return await streakApiRequest(this, 'DELETE', `/pipelines/${pipelineKey}/stages/${stageKey}`);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The stage operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
