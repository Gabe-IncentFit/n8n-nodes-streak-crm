import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import {
	streakApiRequest,
	streakApiFormRequest,
	validateParameters,
	fetchAllResults,
	getPageParameter,
	handlePagination,
} from './utils';

import { getFieldDef, toFieldValue, StreakFieldDef } from './fieldHelpers';

/**
 * Read a "multiple values" string parameter as a list of non-empty strings.
 */
function toStringList(value: unknown): string[] {
	const list = Array.isArray(value) ? value : value === undefined || value === '' ? [] : [value];
	return list.map((v) => String(v).trim()).filter(Boolean);
}

/**
 * Handle field-related operations for the Streak API
 */
export async function handleFieldOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle field operations
	if (operation === 'listFields') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/fields`);
	} else if (operation === 'getField') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const fieldKey = this.getNodeParameter('fieldKey', itemIndex) as string;

		validateParameters.call(
			this,
			{ pipelineKey, fieldKey },
			['pipelineKey', 'fieldKey'],
			itemIndex,
		);

		return await streakApiRequest(this, 'GET', `/pipelines/${pipelineKey}/fields/${fieldKey}`);
	} else if (operation === 'createField') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const fieldName = this.getNodeParameter('fieldName', itemIndex) as string;
		const fieldType = this.getNodeParameter('fieldType', itemIndex) as string;

		validateParameters.call(
			this,
			{ pipelineKey, fieldName, fieldType },
			['pipelineKey', 'fieldName', 'fieldType'],
			itemIndex,
		);

		// Streak's create call takes only a name and a type. It ignores anything else,
		// so a dropdown's options are set by an update right after the field exists.
		const fieldParams: IDataObject = {
			name: fieldName,
			type: fieldType,
		};

		let dropdownValues: string[] = [];
		if (fieldType === 'DROPDOWN') {
			dropdownValues = toStringList(this.getNodeParameter('enumValues', itemIndex, []));
			if (dropdownValues.length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'Dropdown Values are required for DROPDOWN field type',
					{ itemIndex },
				);
			}
		}

		const field = (await streakApiFormRequest(
			this,
			'PUT',
			`/pipelines/${pipelineKey}/fields`,
			fieldParams,
		)) as IDataObject;

		if (dropdownValues.length === 0) {
			return field;
		}

		if (!field?.key) {
			throw new NodeOperationError(
				this.getNode(),
				'Streak created the field but returned no key, so its Dropdown Values could not be set',
				{ itemIndex },
			);
		}

		return await streakApiRequest(this, 'POST', `/pipelines/${pipelineKey}/fields/${field.key}`, {
			dropdownSettings: { items: dropdownValues.map((name) => ({ name })) },
		});
	} else if (operation === 'updateField') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const fieldKey = this.getNodeParameter('fieldKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(
			this,
			{ pipelineKey, fieldKey },
			['pipelineKey', 'fieldKey'],
			itemIndex,
		);

		const body: IDataObject = {};

		if (updateFields.name) {
			body.name = updateFields.name;
		}

		if (updateFields.enumValues !== undefined) {
			const field = (await streakApiRequest(
				this,
				'GET',
				`/pipelines/${pipelineKey}/fields/${fieldKey}`,
			)) as unknown as StreakFieldDef;

			if (field?.type !== 'DROPDOWN') {
				throw new NodeOperationError(
					this.getNode(),
					'Dropdown Values only apply to dropdown fields',
					{ itemIndex },
				);
			}

			// Streak replaces the options with this list. An option listed under its current
			// name keeps its key, so boxes that already use it keep their value.
			const existing = field.dropdownSettings?.items || [];
			body.dropdownSettings = {
				items: toStringList(updateFields.enumValues).map((name) => {
					const match = existing.find((item) => item.name.toLowerCase() === name.toLowerCase());
					return match ? { key: match.key, name } : { name };
				}),
			};
		}

		if (Object.keys(body).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		return await streakApiRequest(
			this,
			'POST',
			`/pipelines/${pipelineKey}/fields/${fieldKey}`,
			body,
		);
	} else if (operation === 'deleteField') {
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const fieldKey = this.getNodeParameter('fieldKey', itemIndex) as string;

		validateParameters.call(
			this,
			{ pipelineKey, fieldKey },
			['pipelineKey', 'fieldKey'],
			itemIndex,
		);

		await streakApiRequest(this, 'DELETE', `/pipelines/${pipelineKey}/fields/${fieldKey}`);
		return { success: true };
	} else if (operation === 'listFieldValues') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		const endpoint = `/boxes/${encodeURIComponent(boxKey)}/fields`;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;

		// Without page or limit, Streak returns every field value in one response
		if (returnAll) {
			return await fetchAllResults(this, endpoint, undefined, 'v1');
		}

		// v1 accepts page and limit, but its response is a bare array with no hasNextPage
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const page = getPageParameter.call(this, itemIndex);

		return await handlePagination(this, endpoint, false, limit, {}, 'v1', page);
	} else if (operation === 'getFieldValue') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const fieldKey = this.getNodeParameter('fieldKey', itemIndex) as string;

		validateParameters.call(this, { boxKey, fieldKey }, ['boxKey', 'fieldKey'], itemIndex);

		return await streakApiRequest(
			this,
			'GET',
			`/boxes/${encodeURIComponent(boxKey)}/fields/${encodeURIComponent(fieldKey)}`,
		);
	} else if (operation === 'updateFieldValue') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const fieldKey = this.getNodeParameter('fieldKey', itemIndex) as string;
		const fieldValue = this.getNodeParameter('fieldValue', itemIndex) as
			| string
			| number
			| boolean
			| IDataObject;

		validateParameters.call(this, { boxKey, fieldKey }, ['boxKey', 'fieldKey'], itemIndex);

		// Text needs converting for typed fields (checkbox, tag, dropdown, date), which takes
		// the field's definition. A value that's already typed, from an expression, is sent as is.
		const value =
			typeof fieldValue === 'string'
				? toFieldValue(this, await getFieldDef(this, boxKey, fieldKey), fieldValue, itemIndex)
				: fieldValue;

		return await streakApiRequest(
			this,
			'POST',
			`/boxes/${encodeURIComponent(boxKey)}/fields/${encodeURIComponent(fieldKey)}`,
			{ value } as IDataObject,
		);
	}

	throw new NodeOperationError(
		this.getNode(),
		`The field operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
