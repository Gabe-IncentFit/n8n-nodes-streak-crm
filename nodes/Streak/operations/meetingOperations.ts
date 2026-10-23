import { IExecuteFunctions, IDataObject, NodeOperationError } from 'n8n-workflow';
import {
	streakApiRequest,
	validateParameters,
	handlePagination,
	getPageParameter,
} from './utils';

/**
 * Handle meeting-related operations for the Streak API
 */
export async function handleMeetingOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	if (operation === 'listMeetingsInBox') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		if (!returnAll) {
			// v2 pages meetings server-side with page/limit
			return await handlePagination(
				this,
				`/boxes/${boxKey}/meetings`,
				false,
				limit,
				{},
				'v2',
				getPageParameter.call(this, itemIndex),
			);
		}

		// Without page/limit, v2 returns every meeting in one response
		const response = (await streakApiRequest(
			this,
			'GET',
			`/boxes/${boxKey}/meetings`,
		)) as IDataObject;

		let results: IDataObject[] = [];
		if (response?.results && Array.isArray(response.results)) {
			results = response.results as IDataObject[];
		} else if (Array.isArray(response)) {
			results = response;
		}

		return results;
	} else if (operation === 'getMeeting') {
		const meetingKey = this.getNodeParameter('meetingKey', itemIndex) as string;

		validateParameters.call(this, { meetingKey }, ['meetingKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/meetings/${meetingKey}`);
	} else if (operation === 'createMeeting') {
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const meetingType = this.getNodeParameter('meetingType', itemIndex) as string;
		const startTimestampValue = this.getNodeParameter('startTimestamp', itemIndex) as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(
			this,
			{ boxKey, meetingType, startTimestamp: startTimestampValue },
			['boxKey', 'meetingType', 'startTimestamp'],
			itemIndex,
		);

		const body: IDataObject = {
			meetingType,
			startTimestamp: new Date(startTimestampValue).getTime(),
		};

		if (additionalFields.duration !== undefined) {
			// The option is in minutes; Streak stores milliseconds
			body.duration = Number(additionalFields.duration) * 60000;
		}

		if (additionalFields.notes !== undefined) {
			body.notes = additionalFields.notes;
		}

		// Streak rejects a form-encoded body here ("Insufficient params for Meeting"); it needs JSON
		return await streakApiRequest(this, 'POST', `/boxes/${boxKey}/meetings`, body);
	} else if (operation === 'editMeeting') {
		const meetingKey = this.getNodeParameter('meetingKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { meetingKey }, ['meetingKey'], itemIndex);

		if (Object.keys(updateFields).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		if (updateFields.meetingType !== undefined) {
			body.meetingType = updateFields.meetingType;
		}

		if (updateFields.startTimestamp !== undefined) {
			body.startTimestamp = new Date(updateFields.startTimestamp as string).getTime();
		}

		if (updateFields.duration !== undefined) {
			// The option is in minutes; Streak stores milliseconds
			body.duration = Number(updateFields.duration) * 60000;
		}

		if (updateFields.notes !== undefined) {
			body.notes = updateFields.notes;
		}

		return await streakApiRequest(this, 'POST', `/meetings/${meetingKey}`, body);
	} else if (operation === 'deleteMeeting') {
		const meetingKey = this.getNodeParameter('meetingKey', itemIndex) as string;

		validateParameters.call(this, { meetingKey }, ['meetingKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/meetings/${meetingKey}`);

		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Meeting deleted successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The meeting operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
