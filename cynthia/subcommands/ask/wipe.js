const { QuickDB } = require('quick.db');
const db = new QuickDB();

module.exports = {
	aliases: ['reset'],
	run(m) {
		db.set(`${m.author.id}-Kayconn`, '');
		m.reply('memory has been reset');
		return;
	},
};
