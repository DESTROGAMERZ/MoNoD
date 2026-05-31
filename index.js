const http = require('http')
const mineflayer = require('mineflayer')
const fs = require('fs');
let rawdata = fs.readFileSync('config.json');
let data = JSON.parse(rawdata);
var lasttime = -1;
var moving = 0;
var connected = 0;
var actions = [ 'forward', 'back', 'left', 'right']
var lastaction;
var pi = 3.14159;
var moveinterval = 2; // 2 second movement interval
var maxrandom = 5; // 0-5 seconds added to movement interval (randomly)
var host = data["ip"];
var port = Number.parseInt(data["port"], 10);
var username = data["name"];
var serverPort = Number.parseInt(process.env.PORT || '3000', 10);
var startedAt = new Date();

http.createServer(function(req, res) {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      botConnected: connected === 1,
      host: host,
      port: port,
      username: username,
      uptimeSeconds: Math.floor(process.uptime())
    }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!doctype html><html><head><title>MoNoD</title></head><body><h1>MoNoD is running</h1><p>Bot status: ' + (connected === 1 ? 'connected' : 'disconnected') + '</p><p>Target: ' + host + ':' + port + '</p><p>Started: ' + startedAt.toISOString() + '</p><p><a href="/health">Health check</a></p></body></html>');
}).listen(serverPort, function() {
  console.log('Status server listening on port ' + serverPort);
});

var bot = mineflayer.createBot({
  host: host,
  port: port,
  username: username
});
function getRandomArbitrary(min, max) {
       return Math.random() * (max - min) + min;

}
bot.on('login',function(){
	console.log("Logged In")
});
bot.on('time', function() {
    if (connected <1) {
        return;
    }
    if (lasttime<0) {
        lasttime = bot.time.age;
    } else {
        var randomadd = Math.random() * maxrandom * 20;
        var interval = moveinterval*20 + randomadd;
        if (bot.time.age - lasttime > interval) {
            if (moving == 1) {
                bot.setControlState(lastaction,false);
                moving = 0;
                lasttime = bot.time.age;
            } else {
                var yaw = Math.random()*pi - (0.5*pi);
                var pitch = Math.random()*pi - (0.5*pi);
                bot.look(yaw,pitch,false);
                lastaction = actions[Math.floor(Math.random() * actions.length)];
                bot.setControlState(lastaction,true);
                moving = 1;
                lasttime = bot.time.age;
                bot.activateItem();
            }
        }
    }
});

bot.on('spawn',function() {
    connected=1;
});

bot.on('end',function() {
    connected=0;
    console.log("Disconnected")
});

bot.on('error',function(error) {
    connected=0;
    console.error(error.message)
});
