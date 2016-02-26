var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var Controllers = require('./controllers');

var port = process.env.PORT||3000;
var messages = [];

var signedCookieParser = cookieParser('technode');
var MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({
	url: 'mongodb://localhost/technode'
})

// app.use(express.bodyParser());
// app.use(express.cookieParser());
// app.use(session({
// 	secret: 'technode',
// 	resave: true,
// 	saveUninitialized: false,
// 	cookie: {
// 		maxAge: 60*1000
// 	},
// 	store: sessionStore
// }));

app.use(express.static(path.join(__dirname,'/static')));//将静态文件放在static目录下
app.use(function(req,res){
	res.sendFile(path.join(__dirname,'./static/index.html'));//除了静态文件的请求，其他所有的HTTP请求，都会输出index.html
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(cookieParser());
app.use(session({
	secret: 'technode',
	resave: true,
	saveUninitialized: false,
	cookie: {
		maxAge: 60 * 1000
	},
  store: sessionStore
}));


app.get('/api/validate', function(req,res){
	var _userId = req.session._userId;
	if(_userId){
		Controllers.User.findUserById(_userId,function(err, user){
			if(err){
				res.json(401,{
					msg: err
				})
			}else{
				res.json(user);
			}
		})
	}else{
		res.json(401,null);
	}
})
app.post('/api/login', function(req, res){
	var email = req.body.email;
	if(email){
		Controllers.User.findByEmailOrCreate(email, function(err, user){
			if(err){
				res.json(500, {
					msg: err
				})
			}else{
				req.session._userId = user._id;
				res.json(user);
			}
		})
	}else{
		res.json(403);
	}
})
app.get('/api/logout',function(req,res){
	req.session._userId = null;
	res.json(401);
});

var server = app.listen(port,function(){
	console.log('technode is on port : ' + port + '!');
});
var io = require('socket.io').listen(server);
io.set('authorization', function(handshakeData, accept){
	signedCookieParser(handshakeData, {}, function(err){
		if(err){
			accept(err.message, false);
		}else{
			handshakeData.session = session;
			if(session._userId){
				accept(null, true);
			}else{
				accept('No login');
			}
		}
	});
});

//服务器监听connection事件，有用户连接时，会产生一个socket对象
io.on('connection',function(socket){
	socket.on('getAllMessages',function(){
		socket.emit('allMessages',messages);
	});
	socket.on('createMessage',function(message){
		messages.push(message);
		io.sockets.emit('messageAdded',message);
	});
});