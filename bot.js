const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require('fs');
const lev = require('js-levenshtein');
var currentTriv;
var currentLine;
var channels = [];
var players = [];
var dateObj = new Date();
var currentDate;
var dateQuestions = {d:-1,w:-1,m:-1};


client.on('ready', () => {
    console.log('Logged in as ${client.user.tag}!');
    client.user.setActivity('triv h', { type: 'WATCHING' })
    fs.readFile('./stats.json', 'utf8', (err, s) => {
        if(err){
            return;
        }
        js = JSON.parse(s);
        console.log("Data Loaded");
        channels = js.channels;
        players = js.players;
        currentDate = js.currentDate;
        dateQuestions = js.dateQuestions;
    });
    console.log(players);
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
        currentPlayer = {Name:message.author.username, id:message.author.id, Correct:0, Incorrect:0, OutOfTime:0, Cancelled:0, score:0, daily:false, weekly:false, monthly:false};
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
        currentChannel = {id:message.channel.id, player:currentPlayer, question:"", answer:"", answers:[], timeout:0, wait:0, remaining:0, multiAnswer:false};
        channels.push(currentChannel);
        save();
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
    if(message.content.split("oq")[0] == "triv " || message.content.split("oquestion")[0] == "triv "){
        if(currentChannel.wait > 0){
            if(currentChannel.multiAnswer == false){
                message.channel.send("```diff\n-Question cancelled. The correct answer was \""+currentChannel.answer+"\". -10 points```");
            }
            else{
                var ansString = "[";
                for(var j = 0; j < currentChannel.answers.length; j++){
                    ansString += currentChannel.answers[j];
                    if(j < currentChannel.answers.length-1){
                        ansString += ",";
                    }
                }
                ansString += "]"
                message.channel.send("```diff\n-Question cancelled. The correct answers were \""+ansString+"\". -10 points```");
            }
            currentPlayer.Cancelled++;
            currentPlayer.score -= 10;
            save();
        }
        fs.readFile('TriviaQ.txt', 'utf-8', (err, data) => {
            if (err) throw err;
            var dataSplit = data.split('\n');
            if(Number(message.content.split(" ")[2]) < dataSplit.length){
                currentTriv = Number(message.content.split(" ")[2]);
                console.log(currentTriv);
            }
            else{
                currentTriv = Math.floor(Math.random()*dataSplit.length);
            }
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
            currentChannel.multiAnswer = false;
            message.channel.send("```Trivia question #"+currentTriv+"\n"+currentChannel.question+"```");
            currentChannel.wait = 90;
            currentChannel.player = currentPlayer;
            currentChannel.remaining = 5;
        });
    }
    else if(message.content.split("q")[0] == "triv " || message.content.split("question")[0] == "triv "){
        if(currentChannel.wait > 0){
            if(currentChannel.multiAnswer == false){
                message.channel.send("```diff\n-Question cancelled. The correct answer was \""+currentChannel.answer+"\". -10 points```");
            }
            else{
                var ansString = "[";
                for(var j = 0; j < currentChannel.answers.length; j++){
                    ansString += currentChannel.answers[j];
                    if(j < currentChannel.answers.length-1){
                        ansString += ",";
                    }
                }
                ansString += "]"
                message.channel.send("```diff\n-Question cancelled. The correct answers were \""+ansString+"\". -10 points```");
            }
            currentPlayer.Cancelled++;
            currentPlayer.score -= 10;
        }
        fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
            if (err) throw err;
            var dataSplit = data.split('\n');
            if(Number(message.content.split(" ")[2]) < dataSplit.length){
                currentTriv = Number(message.content.split(" ")[2]);
                console.log(currentTriv);
            }
            else{
                currentTriv = Math.floor(Math.random()*(dataSplit.length-5000)+5000);
            }
            var isReal = false;
            while(!isReal){
                try{
                    var currentJson = JSON.parse(dataSplit[currentTriv]);
                    isReal = true;
                }
                catch{
                    if(Number(message.content.split(" ")[2]) > 0){
                        message.channel.send(```Invalid Question. Sorry!```);
                        return;
                    }
                    else{
                        currentTriv  = Math.floor(Math.random()*dataSplit.length);
                    }
                }
            }
            
            currentChannel.question = currentJson.question;
            if(currentChannel.answer != 0){
                currentChannel.answer = currentJson.answer;
                currentChannel.multiAnswer = false;
            }
            else{
                currentChannel.answers = currentJson.answers;
                currentChannel.multiAnswer = true;
            }

            currentChannel.answering = true;
            message.channel.send("```Trivia question #"+currentTriv+"\n"+currentChannel.question+"```");
            currentChannel.wait = 90;
            currentChannel.player = currentPlayer;
            currentChannel.remaining = 5;
        })
    }
    else if(message.content.split("d")[0] == "triv " || message.content.split("daily")[0] == "triv "){
        if(currentDate != dateObj.getDate()){
            currentDate = dateObj.getDate();
            for(var i = 0; i < players.length; i++){
                players[i].daily = false;
            }
            dateQuestions.d = Math.floor(Math.random()*4000+1000);
            var isReal = false;
            fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
                var dataSplit = data.split('\n');

                while(!isReal){
                    try{
                        JSON.parse(dataSplit[dateQuestions.d]);
                        isReal = true;
                    }
                    catch{
                        dateQuestions.d = Math.floor(Math.random()*4000+1000);
                    }
                }
            });
        }
        if(currentPlayer.daily == true){
            message.channel.send("```You have already answered this question today!```");
        }
        else{
            currentPlayer.daily = true;
            fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {

                if (err) throw err;
                var dataSplit = data.split('\n');
                var currentJson = JSON.parse(dataSplit[dateQuestions.d]);
                currentTriv = dateQuestions.d;
                currentChannel.question = currentJson.question;
                if(currentChannel.answer != 0){
                    currentChannel.answer = currentJson.answer;
                    currentChannel.multiAnswer = false;
                }
                else{
                    currentChannel.answers = currentJson.answers;
                    currentChannel.multiAnswer = true;
                }

                currentChannel.answering = true;
                message.channel.send("```Daily Trivia Question:\n"+currentChannel.question+"```");
                currentChannel.wait = 500;
                currentChannel.player = currentPlayer;
                currentChannel.remaining = 1;
            });
        }
    }
    else if(message.content.split("w")[0] == "triv " || message.content.split("weekly")[0] == "triv "){
        if(currentDate != dateObj.getDate() && dateObj.getDay() == "Mon" || dateQuestions.w == -1){
            console.log("weekly");
            currentDate = dateObj.getDate();
            for(var i = 0; i < players.length; i++){
                players[i].weekly = false;
            }
            console.log("weekly2");
            dateQuestions.w = Math.floor(Math.random()*400+100);
            var isReal = false;
            while(!isReal){
                fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
                    try{
                        console.log(dateQuestions);
                        JSON.parse(dataSplit[dateQuestions.w]);
                        isReal = true;
                    }
                    catch{
                        console.log(dateQuestions);
                        dateQuestions.w = Math.floor(Math.random()*400+100);
                    }
                });
            }
            console.log("weekly3");
        }
        if(currentPlayer.weekly == true){
            message.channel.send("```You have already answered this this week!```");
        }
        else{
            currentPlayer.weekly = true;
            fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
                if (err) throw err;
                var dataSplit = data.split('\n');
                var currentJson = JSON.parse(dataSplit[dateQuestions.w]);
                currentTriv = dateQuestions.w;
                currentChannel.question = currentJson.question;
                if(currentChannel.answer != 0){
                    currentChannel.answer = currentJson.answer;
                    currentChannel.multiAnswer = false;
                }
                else{
                    currentChannel.answers = currentJson.answers;
                    currentChannel.multiAnswer = true;
                }

                currentChannel.answering = true;
                message.channel.send("```Weekly Trivia Question:\n"+currentChannel.question+"```");
                currentChannel.wait = 2000;
                currentChannel.player = currentPlayer;
                currentChannel.remaining = 1;
            });
        }
    }
    else if(message.content.split("m")[0] == "triv " || message.content.split("monthly")[0] == "triv "){
        if(currentDate != dateObj.getDate() && dateObj.getDate() == 1 || dateQuestions.m == -1){
            currentDate = dateObj.getDate();
            for(var i = 0; i < players.length; i++){
                players[i].monthly = false;
            }
            dateQuestions.m = Math.floor(Math.random*100);
            var isReal = false;
            fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
                while(!isReal){
                    try{
                        JSON.parse(dataSplit[dateQuestions.m]);
                        isReal = true;
                    }
                    catch{
                        dateQuestions.m = Math.floor(Math.random*100);
                    }
                }
            });
        }
        if(currentPlayer.monthly == true){
            message.channel.send("```You have already answered this this week!```");
        }
        else{
            currentPlayer.monthly = true;
            fs.readFile('TriviaQ2.json', 'utf-8', (err, data) => {
                if (err) throw err;
                var dataSplit = data.split('\n');
                var currentJson = JSON.parse(dataSplit[dateQuestions.m]);
                currentTriv = dateQuestions.m;
                currentChannel.question = currentJson.question;
                if(currentChannel.answer != 0){
                    currentChannel.answer = currentJson.answer;
                    currentChannel.multiAnswer = false;
                }
                else{
                    currentChannel.answers = currentJson.answers;
                    currentChannel.multiAnswer = true;
                }

                currentChannel.answering = true;
                message.channel.send("```Monthly Trivia Question:\n"+currentChannel.question+"```");
                currentChannel.wait = 10000;
                currentChannel.player = currentPlayer;
                currentChannel.remaining = 1;
            });
        }
    }
    else if(currentChannel.wait > 0){
        if(message.content == "cancel" || message.content == "idk" || message.content == "nvm"){
            if(currentChannel.multiAnswer == false){
                message.channel.send("```diff\n-Question cancelled. The correct answer was \""+currentChannel.answer+"\". -10 points```");
            }
            else{
                var ansString = "[";
                for(var j = 0; j < currentChannel.answers.length; j++){
                    ansString += currentChannel.answers[j];
                    if(j < currentChannel.answers.length-1){
                        ansString += ",";
                    }
                }
                ansString += "]"
                message.channel.send("```diff\n-Question cancelled. The correct answers were \""+ansString+"\". -10 points```");
            }
            currentPlayer.Cancelled++;
            currentChannel.wait = 0;
            currentPlayer.score -= 10;
            return;
        }
        else if(currentChannel.multiAnswer == false && lev(message.content.toLowerCase().replace(/\s/, '').split(' ')[0].replace(/[t][h][e]/i, '') , currentChannel.answer.toString().toLowerCase().replace(/\s/,'').split(' ')[0].replace(/[t][h][e]/i, '')) <= currentChannel.answer.length/5){
            message.channel.send("```diff\n+Correct! The answer was \""+currentChannel.answer+"\". Solved after "+(90-currentChannel.wait)+" seconds. +"+(Math.ceil(currentChannel.wait/10)*10+10)+" points```");
            currentPlayer.score += (Math.ceil(currentChannel.wait/10)*10+10);
            
            currentChannel.wait = 0;
            currentPlayer.Correct++;
            return;
        }
        else{
            for(var i = 0; i < currentChannel.answers.length; i++){
                if(lev(message.content.toLowerCase().replace(/\s/, '').split(' ')[0].replace(/[t][h][e]/i, '') , currentChannel.answers[i].toLowerCase().replace(/\s/,'').split(' ')[0].replace(/[t][h][e]/i, '')) < currentChannel.answers[i].length/5){
                    var ansString = "[";
                    for(var j = 0; j < currentChannel.answers.length; j++){
                        ansString += currentChannel.answers[j];
                        if(j < currentChannel.answers.length-1){
                            ansString += ",";
                        }
                    }
                    ansString += "]"
                    message.channel.send("```diff\n+Correct! The answers were \""+ansString+"\". Solved after "+(90-currentChannel.wait)+" seconds. +"+(Math.ceil(currentChannel.wait/10)*10+10)+" points```");
                    currentPlayer.score += (Math.ceil(currentChannel.wait/10)*10+10);
                    
                    currentChannel.wait = 0;
                    currentPlayer.Correct++;
                    return;
                }
            }
        }
        currentChannel.remaining--;
        if(currentChannel.remaining > 0){
            message.channel.send("```diff\n-Incorrect. You have "+currentChannel.remaining+" guesses left. -5 points```");
            currentPlayer.score-=5;
        }
        else{
            if(currentChannel.multiAnswer == false){
                message.channel.send("```diff\n-Incorrect. The correct answer was \""+currentChannel.answer+"\". -10 points```");
            }
            else{
                var ansString = "[";
                for(var j = 0; j < currentChannel.answers.length; j++){
                    ansString += currentChannel.answers[j];
                    if(j < currentChannel.answers.length-1){
                        ansString += ",";
                    }
                }
                ansString += "]"
                message.channel.send("```diff\n-Incorrect. The correct answers were \""+ansString+"\". -10 points```");
            }
            currentChannel.wait = -1;
            currentPlayer.score-=10;
        }
        currentPlayer.Incorrect++;
        save();
    }
    if(message.content == "triv stats" || message.content == "triv s"){
        message.channel.send("```diff\nStats for "+currentPlayer.Name+"\n\n"+(currentPlayer.score > 0 ? '+' : '-') +"Score: "+currentPlayer.score+"\n+Answered Correctly "+currentPlayer.Correct+" times \n-Answered Incorrectly "+currentPlayer.Incorrect+" times \n"+(Math.floor(currentPlayer.Correct/(currentPlayer.Incorrect+currentPlayer.Correct)*100)>50?"+":"-")+"Answered Correctly "+Math.floor(currentPlayer.Correct/(currentPlayer.Incorrect+currentPlayer.Correct)*100)+"% of the time\n-Ran out of time "+currentPlayer.OutOfTime+" times\n-Cancelled a question "+currentPlayer.Cancelled+" times```")
    }
    if(message.content == "triv h" || message.content == "triv help"){
        message.channel.send("```Trivia bot commands: \ntriv question: recieve a trivia question to try to answer. This will also cancel a previous question if it is currently being asked. Aliases: triv q\ntriv daily: give the daily trivia question. Aliases: triv d\ntriv weekly: give the weekly trivia question. Aliases: triv w\ntriv monthly: give the monthly trivia question. Aliases: triv m\ncancel: cancel the question currently being asked. Aliases: idk, nvm\ntriv stats: displays statistics about you. Aliases: triv s\ntriv help: displays this help message. Alisases: triv h\ntriv ping: pings triviaBot and displays a response time. Aliases: triv p```");
    }
});

client.login(process.env.BOT_TOKEN);

var interval = setInterval(function(){
    for(var i = 0; i < channels.length; i++){
        channels[i].wait--;
        if(channels[i].wait == 0){
            var currentChannel = channels[i];
            if(currentChannel.multiAnswer == false){
                client.channels.get(channels[i].id,"id").send("```diff\n-Out of time. The correct answer was \""+currentChannel.answer+"\". -10 points```");
            }
            else{
                var ansString = "[";
                for(var j = 0; j < currentChannel.answers.length; j++){
                    ansString += currentChannel.answers[j];
                    if(j < currentChannel.answers.length-1){
                        ansString += ",";
                    }
                }
                ansString += "]"
                client.channels.get(channels[i].id,"id").send("```diff\n-Out of time. The correct answers were \""+ansString+"\". -10 points```");
            }
            channels[i].player.OutOfTime++;
            channels[i].player.score -= 10;
            save();
        }
    }
},1000);

function save(){
    const saveObject = {channels:channels, players:players, currentDate:currentDate, dateQuestions:dateQuestions};
    const saveJson = JSON.stringify(saveObject);
    fs.writeFile("stats.json", saveJson, err => {
        if(!err){
            console.log("Data Saved");
        }
    });
}