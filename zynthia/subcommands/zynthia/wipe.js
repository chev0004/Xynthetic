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
		const deefault = cookedJason.zynthiaDefault.join('\n');

		//reset to default and clear everything else
		db.set(`Zynncon`, deefault);
		db.set(`Zynnhis`, '');
		db.set(`-ZynnCurrRep`, '');
		db.set(`zynnPrevMsg`, '');
		db.set(`ZynnReplies`, '');
		m.reply('memory has been reset');
		return;
	},
};
