const Discord = require('discord.js');
const client = new Discord.Client();
const mongoose = require('mongoose');
const suggestionModel = require('./models/suggestion');
const config = require('./config');
const { Slash } = require('discord-slash-commands');
const slash = new Slash({ client: client });

mongoose.connect(config.mongo_url, {
	useFindAndModify: false,
	useUnifiedTopology: true,
	useNewUrlParser: true,
});

slash.on('create', (command) => {
	console.log(`Command created: ${JSON.parse(command.config.data).name}`);
});

slash.on('command', async (message) => {
	if (message.name === 'suggest') {
		const suggestion = message.options.find(m => m.name === 'suggestion').value;
		if (suggestion.length < 5) {
			const embed = new Discord.MessageEmbed()
				.setColor('#FF0000')
				.setDescription('<a:wrongggg:755042144539902013> | Suggestion must be greater then 5 words!');
			return message.callback({ embeds: embed });
		}
		if (suggestion.length > 1000) {
			const embed = new Discord.MessageEmbed()
				.setColor('#FF0000')
				.setDescription('<a:wrongggg:755042144539902013> | Suggestion must be lesser then 1000 words!');
			return message.callback({ embeds: embed });
		}
		let avatar;
		if (message.author.avatar.startsWith('a_')) {
			avatar = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.gif`;
		} else {
			avatar = `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png`;
		}
		const channel = await client.channels.cache.get(config.suggestion_channelID);
		const embed = new Discord.MessageEmbed()
			.setAuthor(`${message.author.username}#${message.author.discriminator} | ${message.author.id}`, avatar)
			.setDescription(suggestion)
			.setColor('#04da82')
			.setTimestamp();
		const random = await channel.send(embed);
		const msg = await client.channels.cache.get(config.suggestion_channelID).messages.fetch(random.id);
		const embed1 = new Discord.MessageEmbed()
			.setAuthor(`${message.author.username}#${message.author.discriminator} | ${message.author.id}`, avatar)
			.setDescription(suggestion)
			.setColor('#04da82')
			.setFooter(`Token: ${random.id}`, message.guild.iconURL({ dynamic: true }))
			.setTimestamp();
		msg.edit(embed1);
		const embed2 = new Discord.MessageEmbed()
			.setColor('#04da82')
			.setDescription(`<a:checkmark:766294123372085318> | Your suggestion is submitted here, <#${config.suggestion_channelID}>!\n\n**Note : **You agreed to get a DM on a reply over your suggestion!`);
		message.callback({ embeds: embed2 });
		const sug = new suggestionModel({
			suggestion: suggestion,
			message: random.id,
			author: message.author.id,
		});
		await sug.save();
	} if (message.name === 'reply') {
		const token = message.options.find(m => m.name === 'token').value;
		if (!message.member.roles.includes(config.developer_role)) {
			const embed = new Discord.MessageEmbed()
				.setColor('#FF0000')
				.setDescription(`<a:wrongggg:755042144539902013> | You are required to have <@&${config.developer_role}> role to reply to the suggestions!`);
			return message.callback({ embeds: embed });
		}
		const model = await suggestionModel.findOne({ message: token });
		if (!model) {
			const embed = new Discord.MessageEmbed()
				.setColor('#FF0000')
				.setDescription('<a:wrongggg:755042144539902013> | That\'s not a valid token or the message is deleted!');
			return message.callback({ embeds: embed });
		}
		const msg = await client.channels.cache.get(config.suggestion_channelID).messages.fetch(model.message);
		const reply = message.options.find(m => m.name === 'reply').value;
		const author = await client.users.cache.find((u) => u.id === model.author);
		const embed = new Discord.MessageEmbed()
			.setAuthor(`${author.username}#${author.discriminator} | ${author.id}`, author.displayAvatarURL({ dynamic: true }))
			.setDescription(model.suggestion)
			.addField(`Response from ${message.author.username}#${message.author.discriminator} | ${message.author.id}`, reply)
			.setColor('#04da82')
			.setTimestamp()
			.setFooter(`Token: ${model.message}`, message.guild.iconURL({ dynamic: true }));
		msg.edit(embed);
		const embed1 = new Discord.MessageEmbed()
			.setColor('#04da82')
			.setDescription('<a:checkmark:766294123372085318> | Successfully replied to the suggestion!');
		message.callback({ embeds: embed1 });
		const embed2 = new Discord.MessageEmbed()
			.setColor('#04da82')
			.setDescription(`You got a reply over your suggestion. **[\`Message Link\`](https://discord.com/channels/${message.guild.id}/${config.suggestion_channelID}/${model.message})**`);
		author.send(embed2)
			.catch(async (e) => {
				console.log(e);
				const embed3 = new Discord.MessageEmbed()
					.setColor('#04da82')
					.setDescription(`You got a reply over your suggestion. [\`Message Link\`](https://discord.com/channels/${message.guild.id}/${config.suggestion_channelID}/${model.message})`);
				await client.channels.cache.get(config.suggestion_channelID).send(`**<@${author.id}>**`, embed3);
			});
		await suggestionModel.findOneAndDelete({ message: model.message })
			.catch((err) => {
				console.log(err);
			});
	}
});

client.on('ready', () => {
	console.log(`${client.user.username} is online!`);
	slash.create({
		guildOnly: true,
		guildID: '832863797143535617',
		data: {
			name: 'suggest',
			description: 'Suggest something.',
			options: [{
				name: 'suggestion',
				description: 'Please type your suggestion.',
				required: true,
				type: 3,
			}],
		},
	});
	slash.create({
		guildOnly: true,
		guildID: '832863797143535617',
		data: {
			name: 'reply',
			description: 'Reply to the suggestion.',
			options: [{
				name: 'token',
				description: 'Please enter the token.',
				required: true,
				type: 3,
			}, {
				name: 'reply',
				description: 'Please type your reply.',
				required: true,
				type: 3,
			}],
		},
	});
});

client.login(config.token);