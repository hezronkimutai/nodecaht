var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var port = process.env.PORT || 3000;

app.get('/chats', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/signup.html');
});
function saveChats(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile('dbChats.json', JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
function saveUsers(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile('dbUsers.json', JSON.stringify(data, null, 2), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
async function createChat(newRecord) {
  const chats = await getChats();
  chats.push(newRecord);
  await saveChats(chats);
  return newRecord;
}
async function createUser(newRecord) {
  const users = await getUsers();
  users.push(newRecord);
  await saveUsers(users);
  return newRecord;
}

function getUsers() {
  return new Promise((resolve, reject) => {
    fs.readFile('dbUsers.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const json = JSON.parse(data);
        resolve(json);
      }
    });
  });
}
function getChats() {
  return new Promise((resolve, reject) => {
    fs.readFile('dbChats.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        const json = JSON.parse(data);
        resolve(json);
      }
    });
  });
}

io.on('connection', async function(socket){
  console.log('a user connected');
  const chats = await getChats();

  const users = await getUsers();
  users.forEach((user)=>{
    socket.on(user, async function(msg){
      createChat(msg);
      const mss = await getChats()
      mss.push(msg);
      const ms = mss.filter((m)=>{
        if(m.user ===user){
          return m;
        }
      })      
      io.emit(user, ms);
    });
  })

  socket.on('signup user', async function(msg){
    createUser(msg);
    io.emit('signup user',"Success");
  });
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
