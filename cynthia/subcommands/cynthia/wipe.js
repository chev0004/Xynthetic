const { QuickDB } = require('quick.db');
const path = require('path');
const fs = require('fs');
const db = new QuickDB();

module.exports = {
	aliases: [],
	run(m) {
		const whereIsJason = path.join(__dirname, '..', '..', 'jason.json');
		const rawJason = fs.readFileSync(whereIsJason, 'utf-8');
		const cookedJason = JSON.parse(rawJason);
		const deefault = cookedJason.cynthiaDefault.join('\n');

		//reset to default and clear everything else
		db.set(`${m.author.id}-Cynncon`, deefault);
		db.set(`${m.author.id}-Cynnhis`, '');
		db.set(`${m.author.id}-CynnCurrRep`, '');
		db.set(`${m.author.id}-CynnPrevMsg`, '');
		db.set(`${m.author.id}-CynnReplies`, '');
		m.reply('memory has been reset');
		return;
	},
};
