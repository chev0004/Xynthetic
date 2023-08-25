const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
	name: 'messageReactionAdd',
	async execute(reaction, mf) {
		if (mf.bot) return;
		const m = reaction.message;
		if (
			m.author.id != '1086598524327706664' ||
			(reaction.emoji.name != '⬅' && reaction.emoji.name != '➡')
		)
			return;

		const previousContext = await db.get(`${mf.id}-Cynncon`);
		let splitCon = previousContext.split('\n'); //grab the context and split it (you'll see why (I actually just forgot))
		let replies = (await db.get(`${mf.id}-CynnReplies`)) || [];
		let currentReply = await db.get(`${mf.id}-CynnCurrRep`);

		async function cycleLeft() {
			const currentIndex = replies.indexOf(currentReply); //the position of current reply
			if (currentIndex == 0) return; //if its index is zero (aka is the first reply), don't do anything
			const newCurr = replies[currentIndex - 1]; //subtract one to move current reply to the left
			db.set(`${mf.id}-CynnCurrRep`, newCurr); //update current reply
			splitCon[splitCon.length - 2] = `Cynthia: ${newCurr}`; //this is so inefficient bro (help me). replace the last line with the current reply EACH TIME this button is pressed. (it is very slow)
			db.set(`${mf.id}-Cynncon`, splitCon.join('\n')); //update context
			m.channel.messages.fetch(m.id).then((msg) => msg.edit(newCurr)); //edit the bot's last message
		}

		async function cycleRight() {
			const currentIndex = replies.indexOf(currentReply); //the position of current reply
			if (currentIndex == replies.length - 1) return; //if its index equal to the length (aka is the latest), don't do anything
			const newCurr = replies[currentIndex + 1]; //add one to move current reply to the right
			db.set(`${mf.id}-CynnCurrRep`, newCurr); //update current reply
			splitCon[splitCon.length - 2] = `Cynthia: ${newCurr}`; //replace the last line with the current reply each time this button is pressed
			db.set(`${mf.id}-Cynncon`, splitCon.join('\n')); //update context
			m.channel.messages.fetch(m.id).then((msg) => msg.edit(newCurr)); //edit the bot's last message
		}

		if (reaction.emoji.name == '⬅') {
			//cycle left if the left arrow is pressed
			await cycleLeft();
		} else if (reaction.emoji.name == '➡') {
			//cycle left if the left arrow is pressed
			await cycleRight();
		} else return;
	},
	codeName: 'cycleLeftAndRight',
};
