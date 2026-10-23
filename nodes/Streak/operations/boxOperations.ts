import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters, handlePagination, getPageParameter } from './utils';

import { resolveDropdownValue } from './fieldHelpers';

/**
 * Collect the keys of the boxes a search matches. Search pages its results, so with Return All
 * this keeps asking for the next page until one adds no new boxes. Stopping on "nothing new"
 * rather than an empty page also ends the loop if Streak ever ignores `page`.
 */
async function searchBoxKeys(
	context: IExecuteFunctions,
	searchParams: IDataObject,
	returnAll: boolean,
): Promise<string[]> {
	const keys: string[] = [];

	for (let page = 0; ; page++) {
		const response = (await streakApiRequest(
			context,
			'GET',
			'/search',
			undefined,
			{ ...searchParams, page },
			'v1',
		)) as IDataObject;
		const boxes = ((response?.results as IDataObject)?.boxes as IDataObject[]) || [];
		const fresh = boxes
			.map((box) => (box.boxKey ?? box.key) as string)
			.filter((key) => key && !keys.includes(key));
		keys.push(...fresh);

		if (!returnAll || fresh.length === 0) {
			return keys;
		}
	}
}

/**
 * Search results are slim (no `key`, `fields`, notes or timestamps), so fetch the full boxes
 * with the batch endpoint, 100 at a time, and return them in search order.
 */
async function getBoxesByKey(
	context: IExecuteFunctions,
	pipelineKey: string,
	boxKeys: string[],
): Promise<IDataObject[]> {
	const byKey = new Map<string, IDataObject>();

	for (let i = 0; i < boxKeys.length; i += 100) {
		const response = (await streakApiRequest(
			context,
			'POST',
			`/pipelines/${pipelineKey}/boxes/batch/get`,
			boxKeys.slice(i, i + 100) as unknown as IDataObject[],
			undefined,
			'v2',
		)) as IDataObject | IDataObject[];
		const boxes = Array.isArray(response) ? response : ((response?.results as IDataObject[]) || []);
		for (const box of boxes) {
			byKey.set((box.key ?? box.boxKey) as string, box);
		}
	}

	return boxKeys.map((key) => byKey.get(key)).filter((box): box is IDataObject => !!box);
}


/**
 * Handle box-related operations for the Streak API
 */
export async function handleBoxOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle box operations
	if (operation === 'listBoxes') {
		// List Boxes in Pipeline operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const stageKeyFilterParam = this.getNodeParameter('stageKeyFilter', itemIndex, '') as
			| string
			| { mode: string; value: string };
		const stageKeyFilter =
			typeof stageKeyFilterParam === 'string'
				? stageKeyFilterParam
				: stageKeyFilterParam?.value || '';
		const searchQuery = this.getNodeParameter('searchQuery', itemIndex, '') as string;
		const trimmedSearchQuery = searchQuery?.trim();
		const sortBy = this.getNodeParameter('sortBy', itemIndex, 'lastUpdatedTimestamp') as string;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const page = returnAll ? 0 : getPageParameter.call(this, itemIndex);

		validateParameters.call(this, { pipelineKey }, ['pipelineKey'], itemIndex);

		// If search query is provided, use the search endpoint
		if (trimmedSearchQuery) {
			// The search endpoint doesn't page by limit, so a later page can't be fetched here.
			// Fail loudly rather than return page 0 again, which would never end a page loop.
			if (page > 0) {
				throw new NodeOperationError(
					this.getNode(),
					'Page is not supported together with Search Query. Clear Search Query to page through boxes, or set Page to 0.',
					{ itemIndex },
				);
			}

			// Use the search endpoint for queries
			const searchParams: IDataObject = { query: trimmedSearchQuery };
			if (pipelineKey) {
				searchParams.pipelineKey = pipelineKey;
			}
			if (stageKeyFilter) {
				searchParams.stageKey = stageKeyFilter;
			}

			let boxKeys = await searchBoxKeys(this, searchParams, returnAll);

			// Apply limit if returnAll is false
			if (!returnAll && limit) {
				boxKeys = boxKeys.slice(0, limit);
			}

			// Handle empty search results consistently with normal listing
			if (boxKeys.length === 0) {
				return [];
			}

			return await getBoxesByKey(this, pipelineKey, boxKeys);
		} else {
			// No search query - use regular list boxes endpoint (v1 supports page/limit/sortBy)
			const queryParams: IDataObject = {};
			if (stageKeyFilter) {
				queryParams.stageKey = stageKeyFilter;
			}
			if (sortBy) {
				queryParams.sortBy = sortBy;
			}

			return await handlePagination(
				this,
				`/pipelines/${pipelineKey}/boxes`,
				returnAll,
				returnAll ? 100 : limit,
				queryParams,
				'v1',
				page,
			);
		}
	} else if (operation === 'getBox') {
		// Get Box operation
		const boxKey = this.getNodeParameter('boxKey', itemIndex) as string;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/boxes/${boxKey}`);
	} else if (operation === 'getMultipleBoxes') {
		// Get Multiple Boxes operation
		const boxKeys = this.getNodeParameter('boxKeys', itemIndex) as string[];

		validateParameters.call(this, { boxKeys }, ['boxKeys'], itemIndex);

		// Make individual requests since Streak API doesn't have a true batch endpoint for specific box keys
		const boxes: IDataObject[] = [];
		for (const boxKey of boxKeys) {
			try {
				const response = await streakApiRequest(this, 'GET', `/boxes/${boxKey}`);
				// Normalize response to ensure it's an array of IDataObject
				const normalizedResponse = Array.isArray(response) ? response : [response];
				boxes.push(...normalizedResponse);
			} catch (error) {
				// Use n8n logger for consistent logging
				this.logger?.warn(`Failed to retrieve box ${boxKey}`, { error: error.message });
			}
		}

		// Ensure we always return an array
		return boxes;
	} else if (operation === 'createBox') {
		// Create Box operation
		const pipelineKeyParam = this.getNodeParameter('pipelineKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const pipelineKey =
			typeof pipelineKeyParam === 'string' ? pipelineKeyParam : pipelineKeyParam.value;
		const boxName = this.getNodeParameter('boxName', itemIndex) as string;
		const stageKeyParam = this.getNodeParameter('stageKey', itemIndex, '') as
			| string
			| { mode: string; value: string };
		const stageKey = typeof stageKeyParam === 'string' ? stageKeyParam : stageKeyParam?.value || '';
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(this, { pipelineKey, boxName }, ['pipelineKey', 'boxName'], itemIndex);

		const body: IDataObject = {
			name: boxName,
		};

		if (stageKey) {
			body.stageKey = stageKey;
		}

		if (additionalFields.notes) {
			body.notes = additionalFields.notes;
		}

		if (additionalFields.assignedToSharingEntries) {
			const entries = additionalFields.assignedToSharingEntries as string[];
			const list = (Array.isArray(entries) ? entries : [entries]).filter((e) => !!e);
			body.assignedToSharingEntries = list.map((email) => ({ email }));
		}

		return await streakApiRequest(this, 'POST', `/pipelines/${pipelineKey}/boxes`, body);
	} else if (operation === 'updateBox') {
		// Update Box operation
		const boxKey = this.getNodeParameter('boxKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { boxKey, updateFields }, ['boxKey', 'updateFields'], itemIndex);

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

		if (updateFields.notes) {
			body.notes = updateFields.notes;
		}

		if (updateFields.stageKey) {
			// Handle resourceLocator format for stageKey
			const stageKeyParam = updateFields.stageKey as string | { mode: string; value: string };
			body.stageKey = typeof stageKeyParam === 'string' ? stageKeyParam : stageKeyParam.value;
		}

		if (updateFields.assignedToSharingEntries) {
			const entries = updateFields.assignedToSharingEntries as string[];
			const list = (Array.isArray(entries) ? entries : [entries]).filter((e) => !!e);
			body.assignedToSharingEntries = list.map((email) => ({ email }));
		}

		// Handle custom fields
		const customFields = updateFields.customFields as IDataObject | undefined;
		if (customFields) {
			const fields: IDataObject = {};

			const extractRlocValue = (param: unknown): string => {
				if (typeof param === 'string') return param;
				const obj = param as { mode: string; value: string };
				return obj.value;
			};

			// Text / numeric fields
			if (customFields.field) {
				for (const entry of customFields.field as IDataObject[]) {
					fields[extractRlocValue(entry.key)] = entry.value;
				}
			}

			// Checkbox fields
			if (customFields.checkboxField) {
				for (const entry of customFields.checkboxField as IDataObject[]) {
					fields[extractRlocValue(entry.key)] = entry.value;
				}
			}

			// Date fields
			if (customFields.dateField) {
				for (const entry of customFields.dateField as IDataObject[]) {
					fields[extractRlocValue(entry.key)] = new Date(entry.value as string).getTime();
				}
			}

			// Dropdown fields — resolve display name to key if "By Value" mode
			if (customFields.dropdownField) {
				for (const entry of customFields.dropdownField as IDataObject[]) {
					const fieldKey = extractRlocValue(entry.key);
					let value = extractRlocValue(entry.value);

					const valueParam = entry.value as { mode?: string; value: string } | string;
					if (typeof valueParam === 'object' && valueParam.mode === 'id') {
						value = await resolveDropdownValue(this, boxKey, fieldKey, value);
					}

					fields[fieldKey] = value;
				}
			}

			// Tag fields — multiOptions returns an array of selected tag keys
			if (customFields.tagField) {
				for (const entry of customFields.tagField as IDataObject[]) {
					const fieldKey = extractRlocValue(entry.key);
					fields[fieldKey] = entry.value as string[];
				}
			}

			body.fields = fields;
		}

		return await streakApiRequest(this, 'POST', `/boxes/${boxKey}`, body);
	} else if (operation === 'deleteBox') {
		// Delete Box operation
		const boxKey = this.getNodeParameter('boxKey', itemIndex) as string;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		return await streakApiRequest(this, 'DELETE', `/boxes/${boxKey}`);
	} else if (operation === 'getTimeline') {
		// Get Timeline operation
		const boxKey = this.getNodeParameter('boxKey', itemIndex) as string;
		const direction = this.getNodeParameter('direction', itemIndex, 'Descending') as string;
		const timelineFilters = this.getNodeParameter('timelineFilters', itemIndex, []) as string[];
		const startTimestampValue = this.getNodeParameter('startTimestamp', itemIndex, '') as string;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		const baseQuery: IDataObject = { direction };
		if (timelineFilters.length > 0) {
			baseQuery.filters = '[' + timelineFilters.join(',') + ']';
		}
		if (startTimestampValue) {
			const ts = new Date(startTimestampValue).getTime();
			if (!isNaN(ts)) {
				baseQuery.startTimestamp = ts;
			}
		}

		if (returnAll) {
			let allResults: IDataObject[] = [];
			let nextPage: string | undefined;

			do {
				const query: IDataObject = nextPage
					? { nextPageToken: nextPage }
					: { ...baseQuery, limit: 100 };

				const response = (await streakApiRequest(
					this,
					'GET',
					`/boxes/${boxKey}/timeline`,
					undefined,
					query,
				)) as IDataObject;

				if (response?.entries && Array.isArray(response.entries)) {
					allResults = [...allResults, ...(response.entries as IDataObject[])];
				}

				nextPage = response?.nextPage as string | undefined;
			} while (nextPage);

			return allResults;
		} else {
			const query: IDataObject = { ...baseQuery, limit };

			const response = (await streakApiRequest(
				this,
				'GET',
				`/boxes/${boxKey}/timeline`,
				undefined,
				query,
			)) as IDataObject;

			if (response?.entries && Array.isArray(response.entries)) {
				return response.entries as IDataObject[];
			}

			return Array.isArray(response) ? response : [response];
		}
	}

	throw new NodeOperationError(
		this.getNode(),
		`The box operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
