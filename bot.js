const Discord = require('discord.js');
const client = new Discord.Client();

const sf = require('snekfetch');
const fs = require('fs');
var currentTriv;
var currentLine;
var question;
var answering = false;
var answer;
var players = [];


client.on('ready', () => {  
    console.log('Logged in as ${client.user.tag}!');
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
    // sf.get(`https://www.reddit.com/r/trivia/random.json?limit=1`).then(res => {
    // message.channel.send(res.body[0].data.children[0].data.selftext);
    // //console.log(res.body[1].data.children);

    // });
    if(message.content == "triv q" || message.content == "triv question"){
        if(answering){
            message.channel.send("```Previous Question cancelled");
            currentPlayer.Cancelled++;
        }
        fs.readFile('TriviaQ.txt', 'utf-8', (err, data) => {
            if (err) throw err;
            var dataSplit = data.split('\n');
            currentTriv = Math.floor(Math.random()*dataSplit.length);
            currentLine = Math.floor(Math.random()*2);
            var lineSplit = dataSplit[currentTriv].split(',');
            var i;
            if(currentTriv > 2212){
                question = lineSplit[1];
                i = 2;
            }
            else{
                question = lineSplit[0];
                i = 1;
            }
            while(lineSplit[i+1] != ""){
                question += ","+lineSplit[i];
                i++;
            }
            answer = lineSplit[i];
            answering = true;
            message.channel.send("```Trivia question #"+currentTriv+"\n"+question+"```");
            setTimeout(function(){
                if(answering){
                    message.channel.send("```Out of time. The correct answer was "+answer+"```");
                    currentPlayer.OutOfTime++;
                    answering = false;
                }
            },30000);
        });
    }
    else if(answering){
        if(message.content == "cancel"){
            message.channel.send("```Trivia question cancelled. The answer was "+answer+"```");
            currentPlayer.Cancelled++;
            answering = false;

        }
        else if(message.content.toLowerCase() == answer.toLowerCase()){
            message.channel.send("```Correct! The answer was "+answer+"```");
            answering = false;
            currentPlayer.Correct++;
        }
        else{
            currentPlayer.Incorrect++;
        }
    }
    if(message.content == "triv stats" || message.content == "triv s"){
        message.channel.send("```Stats for "+currentPlayer.Name+"\n\nAnswered Correctly "+currentPlayer.Correct+" times \nAnswered Incorrectly "+currentPlayer.Incorrect+" times \nRan out of time "+currentPlayer.OutOfTime+" times\nCancelled a question "+currentPlayer.Cancelled+" times```")
    }
});

client.login(process.env.BOT_TOKEN);