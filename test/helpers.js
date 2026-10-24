/**
 * Minimal stand-in for n8n's IExecuteFunctions. Returns `parameters[name]` (or the
 * caller's default), records every HTTP request in `calls`, and answers each request
 * with the next entry of `responses`.
 */
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

module.exports = { createContext };
