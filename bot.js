const Discord = require('discord.js');
const client = new Discord.Client();

const sf = require('snekfetch');
const fs = require('fs');
const lev = require('js-levenshtein');
var currentTriv;
var currentLine;
var channels = [];
var players = [];


client.on('ready', () => {  
    console.log('Logged in as ${client.user.tag}!');
    client.user.setActivity('triv h', { type: 'WATCHING' })
});

client.on('message', message => {
    if (message.author == client.user){
        return;
    }
    var currentPlayer;
    var addName = true;
    for(var i = 0; i < players.length; i++){
        if(players[i].id == message.author.id){
            addName = false;
            currentPlayer = players[i];
        }
    }
    if(addName){
        currentPlayer = {Name:message.author.username, id:message.author.id, Correct:0, Incorrect:0, OutOfTime:0, Cancelled:0};
        players.push(currentPlayer);
    }
    var currentChannel;
    var addChannel = true;
    for(var i = 0; i < channels.length; i++){
        if(channels[i].id == message.channel.id){
            addChannel = false;
            currentChannel = channels[i];
        }
    }
    if(addChannel){
        currentChannel = {id:message.channel.id, player:currentPlayer, question:"", answer:"", timeout:0, wait:0, remaining:0};
        channels.push(currentChannel);
    }
    
    // sf.get(`https://www.reddit.com/r/trivia/random.json?limit=1`).then(res => {
    // message.channel.send(res.body[0].data.children[0].data.selftext);
    // //console.log(res.body[1].data.children);

    // });
    if (message.content == 'triv ping' || message.content == 'triv p') {
        message.reply("pong")
        .then(rep => {
            let ping = rep.createdTimestamp-message.createdTimestamp;
            rep.edit(`<@${message.author.id}> ponged after ` + ping.toString() + "ms.");
        })
        .catch(console.error);
    }
    if(message.content == "triv q" || message.content == "triv question"){
        if(currentChannel.wait > 0){
            message.channel.send("```Previous Question cancelled. The answer was \""+currentChannel.answer+"\".```");
            currentPlayer.Cancelled++;
        }
        fs.readFile('TriviaQ.txt', 'utf-8', (err, data) => {
            if (err) throw err;
            var dataSplit = data.split('\n');
            currentTriv = Math.floor(Math.random()*dataSplit.length);
            currentLine = Math.floor(Math.random()*2);
            var lineSplit = dataSplit[currentTriv].split(',');
            var i;
            if(currentTriv > 17448){
                currentChannel.question = lineSplit[2];
                i = 3;
            }
            else if(currentTriv > 2212){
                currentChannel.question = lineSplit[1];
                i = 2;
            }
            else{
                currentChannel.question = lineSplit[0];
                i = 1;
            }
            if(lineSplit[i-1][0] == '"'){
                while(lineSplit[i-1][lineSplit[i-1].length-1] != '"'){
                    currentChannel.question += ","+lineSplit[i];
                    i++;
                }
                currentChannel.question = currentChannel.question.replace(/\"\"/, 'xqe');
                currentChannel.question = currentChannel.question.replace(/\"/, '').split('"')[0];
                console.log(currentChannel.question);
                currentChannel.question = currentChannel.question.replace(/[x][q][e]/, '"');
            }
            currentChannel.answer = "";
            if(lineSplit[i][0] == '"'){
                while(lineSplit[i-1][lineSplit[i-1].length-1] != '"'){
                    currentChannel.answer += ","+lineSplit[i];
                    i++;
                }
                currentChannel.answer = currentChannel.answer.replace(/\"\"/, 'xqe');
                currentChannel.answer = currentChannel.answer.replace(/\"/, '').split('"')[0];
                
                currentChannel.answer = currentChannel.answer.replace(/[x][q][e]/, '"');
            }
            else{
                currentChannel.answer = lineSplit[i];
            }
            currentChannel.answering = true;
            message.channel.send("```Trivia question #"+currentTriv+"\n"+currentChannel.question+"```");
            currentChannel.wait = 90;
            currentChannel.player = currentPlayer;
            currentChannel.remaining = 5;
        });
    }
    else if(currentChannel.wait > 0){
        if(message.content == "cancel" || message.content == "idk" || message.content == "nvm"){
            message.channel.send("```Trivia question cancelled. The answer was \""+currentChannel.answer+"\".```");
            currentPlayer.Cancelled++;
            currentChannel.wait = 0;
        }
        else if(lev(message.content.toLowerCase().replace(/\s/, '').split(' ')[0].replace(/[t][h][e]/i, '') , currentChannel.answer.toLowerCase().replace(/\s/,'').split(' ')[0].replace(/[t][h][e]/i, '')) <= 2){
            message.channel.send("```Correct! The answer was \""+currentChannel.answer+"\".```");
            currentChannel.wait = 0;
            currentPlayer.Correct++;
        }
        else{
            currentChannel.remaining--;
            if(currentChannel.remaining > 0){
                message.channel.send("```Incorrect. You have "+currentChannel.remaining+" guesses left.```");
            }
            else{
                message.channel.send("```Incorrect. The correct answer was \""+currentChannel.answer+"\".```");
                currentChannel.wait = -1;
            }
            currentPlayer.Incorrect++;
        }
    }
    if(message.content == "triv stats" || message.content == "triv s"){
        message.channel.send("```diff\nStats for "+currentPlayer.Name+"\n\n+Answered Correctly "+currentPlayer.Correct+" times \n-Answered Incorrectly "+currentPlayer.Incorrect+" times \n"+(Math.floor(currentPlayer.Correct/(currentPlayer.Incorrect+currentPlayer.Correct)*100)>50?"+":"-")+"Answered Correctly "+Math.floor(currentPlayer.Correct/(currentPlayer.Incorrect+currentPlayer.Correct)*100)+"% of the time\n-Ran out of time "+currentPlayer.OutOfTime+" times\n-Cancelled a question "+currentPlayer.Cancelled+" times```")
    }
    if(message.content == "triv h" || message.content == "triv help"){
        message.channel.send("```Trivia bot commands: \ntriv question: recieve a trivia question to try to answer. This will also cancel a previous question if it is currently being asked. Aliases: triv q\ncancel: cancel the question currently being asked. Aliases: idk, nvm\ntriv stats: displays statistics about you. Aliases: triv s\ntriv help: displays this help message. Alisases: triv h\ntriv ping: pings triviaBot and displays a response time. Aliases: triv p```");
    }
});

client.login(process.env.BOT_TOKEN);

var interval = setInterval(function(){
    for(var i = 0; i < channels.length; i++){
        channels[i].wait--;
        if(channels[i].wait == 0){
            client.channels.get(channels[i].id,"id").send("```Out of time. The correct answer was \""+channels[i].answer+"\".```");
            channels[i].player.OutOfTime++;
        }
    }
},1000);