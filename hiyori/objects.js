function requestOptions(text, parameters, key) {
	//this ain't no object!! (because it's a function that returns an object (maybe it is an object then (idk)))
	return {
		method: 'POST',
		headers: {
			accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + key,
		},
		body: JSON.stringify({
			input: text,
			model: 'kayra-v1',
			parameters: parameters,
		}),
	};
}

module.exports = {
	requestOptions,
};
