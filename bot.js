
const Discord = require("discord.js");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var jsonfile = require("jsonfile");
var bets = null;
jsonfile.readFile('bets.json', function (err, obj) {
	bets = obj;
});
const client = new Discord.Client();

const me = "419950820281417739";
const admins = ["384452291295576065", "406568474979205120", "194857448673247235", "417573975347167233", "417737600011599893"];
const token = "";

// ***** IMPORTANT *****
// change the following two variables depending on which server this is intended to run in
const bettingChnlHT = "420246989352075273";
const bettingChnlTB = "417732882828886019";
const bettingChnlTP = "420016989977706498";
var bettingChnlDefault = bettingChnlHT;

const dollar =   "<:HTDollar:419962014237065217>";// For Tiquismiquis Playground
					//"<:HTDollar:419938437831983144>";// For HaliteTournaments


const HTServer = "411263442838880256";
const TPServer = "419272722753781760";
const TBServer = "417732882828886017";

const UPDATE_JSON_TIME = 1000;// Updates the JSON database file 1000 ms after an update is
										// requested (i.e. a user registers, or a bet is created, or
										// a user bets, etc).
										// If multiple updates are requested, only update once.

const numDms = 6;
var dms = [];
var ongoingDms = {};
readDMs();

client.on("ready", () => {
	console.log("Running");
	checkActive();
});

client.on("message", (message) => {
	try {
		var chnl = message.channel;
		var bettingChnlId = "";
		if (chnl.guild == null) {
			// must be dm.
			if (ongoingDms[message.author.id] != null && !ongoingDms[message.author.id]['waiting']) {
				console.log(message.author.username + ":\t " + message.content);
				var dm = ongoingDms[message.author.id];
				var msg = dms[dm['dm']][dm['curr']];
				setTimeout(function() {
					
					dm['waiting'] = false;
					
					if (!(msg.trim() == message.content.trim()) && !(message.content.trim().toLowerCase() === "!stop" || message.content.trim().toLowerCase() === "!stop-pranking-me")) {
						message.author.send(msg);
						console.log("me:\t\t " + msg);
						dm['curr'] += 1;
						if (dms[dm['dm']].length <= dm['curr']) {
							ongoingDms[message.author.id] = null;
						}
					}
					else if (message.content.trim().toLowerCase() === "!stop" || message.content.trim().toLowerCase() === "!stop-pranking-me") {
						message.author.send("Okay, fine.");
						ongoingDms[message.author.id] = null;
					}
					else {
						message.author.send("Dammit, you caught on \:disappointed:");
						ongoingDms[message.author.id] = null;
					}
					message.channel.stopTyping(function(){});
				}, msg.length * 50);
				ongoingDms[message.author.id]['waiting'] = true;
				message.channel.startTyping(function(){});
				return;
			}
			else {
				bettingChnlId = bettingChnlDefault;
			}
		}
		else if (chnl.guild.id == HTServer) {
			bettingChnlId = bettingChnlHT;
		}
		else if (chnl.guild.id == TPServer) {
			bettingChnlId = bettingChnlTP;
		}
		else if (chnl.guild.id == TBServer) {
			bettingChnlId = bettingChnlTB;
		}
		if (message.content.substring(0, 1) == '!' && message.content.length >= 2) {
			var args = message.content.substring(1).split(' ');
			var cmd = args[0];
			
			args = args.splice(1);
			if (message.channel.guild != null && message.channel.guild.id == HTServer && message.channel.id != bettingChnlHT) {
				switch (cmd) {
					case 'register':
					case 'balance':
					case 'active':
					case 'cancel-bet':
					case 'bet':
						message.reply("Please use the <#" + bettingChnlHT + "> channel");
						break;
				}
				return;
			}
			switch (cmd) {
				case 'echo':
					if (args.length > 0 && (isAdmin(message.author))) {
						var result = message.content.substring(6);
						message.channel.send(result);
					}
					break;
				case 'announce':
					if (args.length > 0 && (isAdmin(message.author))) {
						var result = message.content.substring(10);
						client.channels.get(bettingChnlId).send(result);
					}
					break;
				case 'channel':
					if (args.length > 0) {
						if (args[0] == bettingChnlTP || args[0] == bettingChnlTB || args[0] == bettingChnlHT) {
							bettingChnlDefault = args[0];
							message.reply("success!");
						}
					}
					break;
				case 'help':
					var msg = "Here's a list of my commands!\n" +
								"```!help\t\tdisplays list of commands\n" +
								"!register\tregisters you in the betting system\n" +
								"!balance\t check your balance\n" + 
								"!active\t  lists active bets\n" +
								"!bet [betID] [playerID, 1 or 2] [amount to bet]\n" +
								"OR\n!bet [@player] [amount]\n"+
								"\t\t\t places a bet\n"+
								"!bet [betId] displays information on the specified bet\n" +
								"!cancel-bet [@player OR betID]\n"+
								"\t\t\t cancels the specified bet```";
					if (isAdmin(message.author) && !(args.length > 0 && args[0] == "player")) {
						msg = msg + "Admin commands:\n" +
						"```!echo [msg]  echoes the message\n"+
						"!announce    echo the message in #betting\n"+
						"!bank [@user] [change in amount]\n"+
						"\t\t\t changes the balance of user by the specified amount\n"+
						"!create [player1] [player2]\n"+
						"\t\t\t creates a new matchup between the players\n"+
						"!close [betId]\n" +
						"\t\t\t stops allowing new bets or canceling bets\n"+
						"!close-all   closes all bets\n"+
						"!finish [betID] [winner, -1, 1, or 2]\n"+
						"\t\t\t finish bet betID with the winner. If -1, cancels the bet.```";
					}
					if (args.length > 0 && (args[0] == "here") || (args[0] == "player"))
						message.channel.send(msg);
					else {
						message.author.send(msg);
						message.reply("I've sent you a DM with a list of commands");
					}
					break;
				case 'register':
					if (bets.users[message.author.id] == null) {
						bets.users[message.author.id] = createNewUser(message.author.id);
						update();
						message.reply("Registration successful! You now have a balance of " + bets.users[message.author.id].balance + " " + dollar);
					}
					else {
						message.reply("You are already registered!");
					}
					break;
				case 'balance':
					if (bets.users[message.author.id] == null) {
						message.reply("You must register before taking any actions!");
					}
					else {
						message.reply("You have a balance of " + bets.users[message.author.id].balance + " " + dollar + " of which " + bets.users[message.author.id].useable + " " + dollar + " is able to be bet at this time.");
					}
					break;
				case 'bank':// !bank @user amtToAdd
					//amtToAdd may be positive or negative
					if (isAdmin(message.author)) {
						var amt = parseInt(args[1]);
						var user = null;
						try {
							user = bets.users[args[0].substring(2, args[0].length - 1)];
						}
						catch (e) {
						}
						if (isNaN(amt) || user == null) {
							message.channel.send('Operation unsuccessful');
							/*console.log(message.content);
							console.log(args[0]);
							console.log(args[0].substring(2, args[0].length - 1));
							console.log(args[1]);*/
						}
						else {
							addBalance(user, amt);
							update();
							message.channel.send('Operation successful; new balance for ' + args[0] + ': ' + user.balance + ' ' + dollar);
						}
					}
					break;
				case 'active':
					var msg = "";
					for (var betId in bets.bets) {
						if (bets.bets[betId] != null) {
							var bet = bets.bets[betId];
							var closed = bet.closed ? "(CLOSED) " : "";
							msg += closed + "Bet " + betId + ": 1) " + bet.opt1 + " (" + bet.bet1 + " " + dollar + ") VS 2) " + bet.opt2 + " (" + bet.bet2 + " " + dollar + ")\n";
						}
					}
					if (msg.length == 0) {
						message.channel.send("No active bets.");
					}
					else {
						message.channel.send(msg);
					}
					break;
				case 'create':// !create option1 option2 [min_bet] [max_bet]
					if (isAdmin(message.author)) {
						if (args[0] != null && args[1] != null && args[2] != null && args[3] == null) {
							var id = parseInt(args[0]);
							if (isNaN(id)) {
								message.reply("cannot create the bet; use !create id player1_id player2_id or !create @player1 @player2");
							}
							else if (bets.bets[id] != null){
								message.reply("cannot create the bet; bet #" + id + " already exists");
							}
							else {
								createBet(NaN, NaN, "<@" + args[1] + ">", "<@" + args[2] + ">", id);
								var msg = "**Bet " + id + " started!**\nBet on a winner: option 1: <@" + args[1] + ">" + " VS option 2: <@" + args[2] + ">";
								msg += "\nTo join in: \"!bet @player amount\"";
								client.channels.get(bettingChnlId).send(msg);
							}
						}
						else if (args[0] != null && args[1] != null) {
							var id = createNewBet(args[2], args[3], args[0], args[1]);
							var msg = "**Bet " + id + " started!**\nBet on a winner: option 1: " + args[0] + " VS option 2: " + args[1];
							msg += "\nTo join in: \"!bet @player amount\"";
							client.channels.get(bettingChnlId).send(msg);
						}
					}
					break;
				case 'cancel-bet':
					var betId = parseInt(args[0]);
					if (args[0] == null) {
						message.reply("which bet? Use !cancel-bet @player or !cancel-bet betID");
						break;
					}
					if (isNaN(betId)) {
						num++;
						for (var key in bets.bets) {
							if (bets.bets[key] != null) {
								var pBet = bets.bets[key].players[message.author.id];
								if (pBet != null && ((pBet.opt == 1 && bets.bets[key].opt1.trim() == args[0].trim()) || (pBet.opt == 2 && bets.bets[key].opt2.trim() == args[0].trim()))) {
									betId = key;
									num++;
								}
							}
						}
						if (num > 1 || num == 0) {
							message.reply("invalid request");
							break;
						}
					}
					if (bets.bets[betId] == null) {
						message.reply("invalid request");
					}
					else if (bets.bets[betId].players[message.author.id] == null) {
						message.reply("cannot cancel a bet you didn't make");
					}
					else if (bets.bets[betId].closed) {
						message.reply("that bet has been closed.");
					}
					else {
						var pBet = bets.bets[betId].players[message.author.id];
						bets.bets[betId].players[message.author.id] = null;
						bets.bets[betId]["num-bets"]--;
						bets.bets[betId]["total-amt"] -= pBet.amt;
						if (pBet.opt == 1) bets.bets[betId].bet1 -= pBet.amt;
						else if (pBet.opt == 2) bets.bets[betId].bet2 -= pBet.amt;
						bets.users[message.author.id].useable += pBet.amt;
						message.reply("your bet has been cancelled");
						update();
					}
					break;
				case 'bet':
					if (!(message.channel.id == bettingChnlId)) {
						message.reply("please use <#" + bettingChnlId + "> to place bets.");
						break;
					}
					var betId = parseInt(args[0]);
					var opt = parseInt(args[1]);
					var amt = parseInt(args[2]);
					if (args[2] == null && args[1] == null && args[0] != null && !isNaN(betId)) {
						if (bets.bets[betId] != null) {
							var bet = bets.bets[betId];
							var closed = bet.closed ? "(CLOSED) " : "";
							message.channel.send(closed + "Bet " + betId + ": 1) " + bet.opt1 + " (" + bet.bet1 + " " + dollar + ") VS 2) " + bet.opt2 + " (" + bet.bet2 + " " + dollar + ")\n");
						}
						else {
							message.reply("invalid request");
						}
						break;
					}
					if (args[2] == null && args[0] != null && args[1] != null) {
						amt = parseInt(args[1]);
						var num = 0;
						for (var key in bets.bets) {
							if (bets.bets[key] != null) {
								if (bets.bets[key].opt1.trim() == args[0].trim()) {
									betId = key;
									opt = 1;
									num++;
								}
								if (bets.bets[key].opt2.trim() == args[0].trim()) {
									betId = key;
									opt = 2;
									num++;
								}
							}
						}
						if (num == 0) {
							message.reply("no active bet involves " + args[0]);
							break;
						}
						else if (num > 1) {
							message.reply("ambiguous bet; please use \"!bet id @user amount\" instead");
							break;
						}
					}
					else {
						if (isNaN(opt) && args[1] != null && !isNaN(betId)) {
							if (args[1].trim() == bets.bets[betId].opt1.trim()) {
								opt = 1;
							}
							else if (args[1].trim() == bets.bets[betId].opt2.trim()) {
								opt = 2;
							}
						}
					}
					if (isNaN(betId) || isNaN(opt) || isNaN(amt)) {
						message.reply("invalid request");
					}
					else if (bets.users[message.author.id] == null) {
						message.reply("you must register before betting.");
					}
					else if (bets.bets[betId] == null) {
						message.reply("that bet is not currently open");
					}
					else if (bets.bets[betId].closed) {
						message.reply("that bet has been closed");
					}
					else if (opt != 1 && opt != 2) {
						message.reply("I can't tell who you're trying to bet for; use 1 or 2 in the second argument.");
					}
					else if (amt > bets.bets[betId].max) {
						message.reply("you can't bet more than " + bets.bets[betId].max + ".");
					}
					else if (amt < bets.bets[betId].min) {
						message.reply("you can't bet less than " + bets.bets[betId].min + ".");
					}
					else if (amt > bets.users[message.author.id].useable) {
						message.reply("you can't bet more than your useable balance of " + bets.users[message.author.id].useable);
					}
					else if (bets.bets[betId].players[message.author.id] != null) {
						message.reply("you already submitted a bet.");
					}
					else {
						var bet = bets.bets[betId];
						if (opt == 1) {
							bet.bet1 += amt;
						}
						else if (opt == 2) {
							bet.bet2 += amt;
						}
						bet["total-amt"] += amt;
						bets.users[message.author.id].useable -= amt;
						if (bet.players[message.author.id] == null) {
							bet["num-bets"]++;
							bet.players[message.author.id] = {
								"amt": amt,
								"opt": opt
							};
							update();
							message.reply("bet successful!");
						}
					}
					break;
				case 'close':// !close bet_id winner
					// if winner is -1, 
					if (isAdmin(message.author)) {
						 var id = parseInt(args[0]);
						if (isNaN(id) || bets.bets[id] == null) {
							message.channel.sent("Invalid ID");
						}
						else {
							bets.bets[id].closed = true;
							client.channels.get(bettingChnlId).send("Bet " + id + " closed. Stay tuned for a winner!");
							update();
							checkActive();
						}
					}
					break;
				case 'close-all':
					if (isAdmin(message.author)) {
						var msg = "";
						for (var id in bets.bets) {
							if (bets.bets[id] != null) {
								if (!bets.bets[id].closed) {
									bets.bets[id].closed = true;
									msg += "Bet " + id + " closed\n"
								}
							}
						}
						if (msg.length > 0) {
							update();
							msg += "Stay tuned for winners!";
							client.channels.get(bettingChnlId).send(msg);
						}
						client.user.setActivity('organizing the tables', { type: 'PLAYING' });;
					}
					break;
				case 'cancel-all':
					if (isAdmin(message.author)) {
						for (var id in bets.bets) {
							if (bets.bets[id] == null) continue;
							for (var playerId in bets.bets[id].players) {
								if (bets.bets[id].players[playerId] != null)
									bets.users[playerId].useable += bets.bets[id].players[playerId].amt;
							}
							bets.bets[id] = null;
							update();
							client.channels.get(bettingChnlId).send("Bet " + id + " canceled.");
							checkActive();
						}
					}
					break;
				case 'finish':
					if (isAdmin(message.author)) {
						var id = parseInt(args[0]);
						var winner = parseInt(args[1]);
						if (isNaN(id) || isNaN(id) || bets.bets[id] == null) {
							message.channel.send("Invalid ID or winner");
							
						}
						else if (winner == -1) {
							for (var playerId in bets.bets[id].players) {
								if (bets.bets[id].players[playerId] != null)
									bets.users[playerId].useable += bets.bets[id].players[playerId].amt;
							}
							bets.bets[id] = null;
							update();
							client.channels.get(bettingChnlId).send("Bet " + id + " canceled.");
							checkActive();
						}
						else if (winner != 1 && winner != 2) {
							message.channel.send("Invalid request; use -1, 1, or 2 for winner");
						}
						else if (!isNaN(id)) {
							var bet = bets.bets[id];
							bets.bets[id] = null;
							applyBet(client.channels.get(bettingChnlId), bet, winner);
							update();
							checkActive();
						}
						else {
							message.channel.send("Invalid request");
						}
					}
					break;
				case 'reset-database':
					if (isAdmin(message.author)) {
						bets = {"users":{},"bets":{},"bet-id":1};
						update();
						message.channel.send("Database has been reset.");
					}
					break;
				case 'dm-me':
				  if (ongoingDms[message.author.id] == null) {
					  message.author.send('Hey!');
					  ongoingDms[message.author.id] = {'user': message.author,
						  										  'dm': parseInt(Math.random() * numDms, 10),
						  										   'curr': 0,
						  											'waiting': false
					  												};
				  }
				  break;
				case 'agree':
				  if (Math.random() < 0.5) {
				  	message.channel.send("\:thumbsdown:");
				  }
				  else {
				  	message.channel.send("\:thumbsup:");
				  }
				  break;
				  
				case 'kthxbai':
				  message.channel.send('Nooo don\'t go so soon!');
				  break;
			}
		}
	}
	catch (e) {
		console.log(e);
	}
});
function checkActive() {
	var count = 0, countClosed = 0, countActive = 0;
	for (var id in bets.bets) {
		if (bets.bets[id] != null) {
			count++;
			if (bets.bets[id].closed) {
				countClosed++;
			}
			else {
				countActive++;
			}
		}
	}
	if (count == 0) {
		client.user.setActivity('taking a nap', { type: 'PLAYING' });;
	}
	else if (countActive == 0) {
		client.user.setActivity('organizing the tables', { type: 'PLAYING' });;
	}
	else {
		client.user.setActivity('taking bets', { type: 'PLAYING' });;
	}
}
function createNewUser(id) {
	return {
		"id": id,
		"balance": 1000,
		"useable": 1000
	};
}
function addBalance(user, amt) {
	user.balance += amt;
	user.useable += amt;
	update();
}
function createNewBet(min, max, opt1, opt2) {
	var id = bets["bet-id"];
	if (id == null || isNaN(id)) id = 0;
	while (bets.bets[id] != null) {
		id = id + 1;
	}
	bets["bet-id"] = id + 1;
	createBet(min, max, opt1, opt2, id);
	return id;
}
function createBet(min, max, opt1, opt2, id) {
	var bet = {
		"num-bets": 0,
		"min": isNaN(min) ? 10 : min,
		"max": isNaN(max) ? 1000 : max,
		"total-amt": 0,
		"bet1": 0,
		"bet2": 0,
		"opt1": opt1,
		"opt2": opt2,
		"players": {},
		"closed": false
	};
	bets.bets[id] = bet;
	update();
	client.user.setActivity('taking bets', { type: 'PLAYING' });;
	return id;
}
function isAdmin(user) {
	for (var i = 0; i < admins.length; i++) {
		var admin = admins[i];
		if (admin == user.id) return true;
	}
	return false;
}
function applyBet(channel, bet, winner) {
	var all = bet.players;
	var betsOnLoser = bet.bet1;
	var betsOnWinner = bet.bet2;
	var msg = "Bet finished! ";
	if (winner == 1) {
		msg += bet.opt1;
		betsOnLoser = bet.bet2;
		betsOnWinner = bet.bet1;
	}
	else if (winner == 2) {
		msg += bet.opt2;
	}
	else msg += "undefined";
	msg += " defeated ";
	if (winner == 1) {
		msg += bet.opt2;
	}
	else if (winner == 2) {
		msg += bet.opt1;
	}
	else msg += "undefined";
	msg += "!\n";
	for (var id in all) {
		if (all[id] != null && all[id].opt == winner) {
			var amtWon = parseInt(betsOnLoser * all[id].amt / betsOnWinner, 10);
			if (amtWon < 10) amtWon = 10;
			bets.users[id].balance += amtWon;
			bets.users[id].useable += all[id].amt + amtWon;
			msg += "<@" + id + "> won " + amtWon + " " + dollar + "!\n";
		}
		else {
			bets.users[id].balance -= all[id].amt;
			msg += "<@" + id + "> lost " + all[id].amt + " " + dollar + "\n";
		}
	}
	channel.send(msg);
}
var needsUpdate = false;
function update() {
	needsUpdate = true;
	setTimeout(function() {
		if (needsUpdate) {
			jsonfile.writeFile('bets.json', bets);
			needsUpdate = false;
		}
	}, UPDATE_JSON_TIME);
}
function readDMs() {
	const NUM = numDms;
	for (var i = 0; i < NUM; i++) {
		var filename = "file://" + __dirname + "\\dms\\" + i + ".txt";
		var xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			try {
				if (this.readyState == 4 && this.status == 200) {
					dms.push(this.responseText.split('\n'));
				}
			} catch (e){console.log(e)};
		}
		xhttp.open("GET", filename, true);
		xhttp.send();
	}
}

client.login(token);
