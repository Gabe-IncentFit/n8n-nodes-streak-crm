import { IExecuteFunctions, IDataObject, NodeOperationError  } from 'n8n-workflow';
import { streakApiRequest, validateParameters, handlePagination, getPageParameter } from './utils';

/**
 * Handle task-related operations for the Streak API
 */
export async function handleTaskOperations(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject | IDataObject[]> {
	// Handle task operations
	if (operation === 'getTask') {
		// Get Task operation
		const taskKey = this.getNodeParameter('taskKey', itemIndex) as string;

		validateParameters.call(this, { taskKey }, ['taskKey'], itemIndex);

		return await streakApiRequest(this, 'GET', `/tasks/${taskKey}`);
	} else if (operation === 'getTasksInBox') {
		// Get Tasks in Box operation
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const returnAll = this.getNodeParameter('returnAll', itemIndex, false) as boolean;
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

		validateParameters.call(this, { boxKey }, ['boxKey'], itemIndex);

		if (returnAll) {
			const results = await handlePagination(
				this,
				`/boxes/${boxKey}/tasks`,
				true,
				100,
				{},
			);

			// Handle pagination results - if empty, return structured response
			if (!results || (Array.isArray(results) && results.length === 0)) {
				return [{ tasks: [], count: 0 }];
			}

			return results;
		} else {
			const page = getPageParameter.call(this, itemIndex);
			const response = await streakApiRequest(
				this,
				'GET',
				`/boxes/${boxKey}/tasks`,
				undefined,
				{ page, limit },
			);

			// Handle the list tasks response - should return an array of tasks
			if (Array.isArray(response)) {
				const taskArray = response as IDataObject[];
				// If empty array, return structured response to keep workflow running
				if (taskArray.length === 0) {
					return [{ tasks: [], count: 0 }];
				}
				return taskArray;
			}

			if (response && typeof response === 'object') {
				const obj = response as IDataObject;
				// Check common response patterns
				if (Array.isArray(obj.tasks)) {
					const tasks = obj.tasks as IDataObject[];
					return tasks.length === 0 ? [{ tasks: [], count: 0 }] : tasks;
				}
				if (Array.isArray(obj.results)) {
					const results = obj.results as IDataObject[];
					return results.length === 0 ? [{ tasks: [], count: 0 }] : results;
				}
				if (Array.isArray(obj.items)) {
					const items = obj.items as IDataObject[];
					return items.length === 0 ? [{ tasks: [], count: 0 }] : items;
				}
				if (Array.isArray(obj.data)) {
					const data = obj.data as IDataObject[];
					return data.length === 0 ? [{ tasks: [], count: 0 }] : data;
				}
			}

			// If no tasks found, return consistent structure (matches loadOptions pattern)
			return [{ tasks: [], count: 0 }];
		}
	} else if (operation === 'createTask') {
		// Create Task operation
		const boxKeyParam = this.getNodeParameter('boxKey', itemIndex) as
			| string
			| { mode: string; value: string };
		const boxKey = typeof boxKeyParam === 'string' ? boxKeyParam : boxKeyParam.value;
		const text = this.getNodeParameter('text', itemIndex) as string;
		const additionalFields = this.getNodeParameter(
			'additionalFields',
			itemIndex,
			{},
		) as IDataObject;

		validateParameters.call(this, { boxKey, text }, ['boxKey', 'text'], itemIndex);

		const body: IDataObject = {
			// v2 requires the box key in the body as `key`
			key: boxKey,
			text,
		};

		if (additionalFields.dueDate) {
			// Convert to Unix timestamp in milliseconds
			const dateValue = additionalFields.dueDate as string;
			body.dueDate = new Date(dateValue).getTime();
		}

		if (additionalFields.assignees && (additionalFields.assignees as string[]).length > 0) {
			// v2 expects an array of objects with { email }
			const assigneesArray = Array.isArray(additionalFields.assignees)
				? (additionalFields.assignees as string[])
				: [String(additionalFields.assignees)];
			body.assignedToSharingEntries = assigneesArray.filter((e) => !!e).map((email) => ({ email }));
		}

		const response = await streakApiRequest(
			this,
			'POST',
			`/boxes/${boxKey}/tasks`,
			body,
		);

		// Handle the create task response - should return a single task object
		if (response && typeof response === 'object') {
			return response as IDataObject;
		}

		return response;
	} else if (operation === 'updateTask') {
		// Update Task operation
		const taskKey = this.getNodeParameter('taskKey', itemIndex) as string;
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;

		validateParameters.call(this, { taskKey }, ['taskKey'], itemIndex);

		if (Object.keys(updateFields).length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'At least one field to update must be specified',
				{ itemIndex },
			);
		}

		const body: IDataObject = {};

		if (updateFields.text) {
			body.text = updateFields.text;
		}

		if (updateFields.dueDate) {
			// Convert to Unix timestamp in milliseconds
			const dateValue = updateFields.dueDate as string;
			body.dueDate = new Date(dateValue).getTime();
		}

		if (updateFields.assignees && (updateFields.assignees as string[]).length > 0) {
			// v2 expects an array of objects with { email }
			const assigneesArray = Array.isArray(updateFields.assignees)
				? (updateFields.assignees as string[])
				: [String(updateFields.assignees)];
			body.assignedToSharingEntries = assigneesArray.filter((e) => !!e).map((email) => ({ email }));
		}

		// Map completed boolean to v2 status enum
		if (updateFields.completed !== undefined) {
			body.status = updateFields.completed ? 'DONE' : 'NOT_DONE';
		}

		const response = await streakApiRequest(
			this,
			'POST',
			`/tasks/${taskKey}`,
			body,
		);

		// Handle the update task response - should return the updated task object
		if (response && typeof response === 'object') {
			return response as IDataObject;
		}

		return response;
	} else if (operation === 'deleteTask') {
		// Delete Task operation
		const taskKey = this.getNodeParameter('taskKey', itemIndex) as string;

		validateParameters.call(this, { taskKey }, ['taskKey'], itemIndex);

		const response = await streakApiRequest(this, 'DELETE', `/tasks/${taskKey}`);

		// Handle the delete task response - return success confirmation
		if (
			response === null ||
			response === undefined ||
			(typeof response === 'string' && response === '') ||
			(typeof response === 'object' && Object.keys(response as IDataObject).length === 0)
		) {
			return { success: true, message: 'Task deleted successfully' };
		}

		return response;
	}

	throw new NodeOperationError(
		this.getNode(),
		`The task operation "${operation}" is not supported!`,
		{ itemIndex },
	);
}
