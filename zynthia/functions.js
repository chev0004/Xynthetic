async function neverGiveUpExceptAfterFailingTwice( //send request and retry if it fails
	url,
	requestOptions,
	retries,
	cooldown,
	m
) {
	return fetch(url, requestOptions, m)
		.then((response) => response.json())
		.catch((error) => {
			if (retries > 0) {
				m.reply(
					'Failed to fetch data from the API. Please send that again'
				);
				console.log(`trying again... stopping until ${retries} more`);
				setTimeout(
					() =>
						neverGiveUpExceptAfterFailingTwice(
							url,
							requestOptions,
							retries - 1
						),
					cooldown
				);
				return;
			} else {
				console.error('from funtions.js:', error);
				return;
			}
		});
}

function limitThatShit(arr, limit, item) {
	//function to limit total indices of history array
	arr.push(item);
	if (arr.length > limit) {
		const elementsToRemove = arr.length - limit;
		arr.splice(0, elementsToRemove);
	}
}

module.exports = {
	neverGiveUpExceptAfterFailingTwice,
	limitThatShit,
};
