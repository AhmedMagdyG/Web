var http = require('http');
var fs = require('fs');
var url = require('url');
var express = require('express');
var app = express();
var session = require('express-session');
app.use(express.static('phase I'));
app.use(session({
    secret: 'Security',
    resave: true,
    saveUninitialized: false
}));

var bodyParser = require('body-parser')
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true
}));


app.get('/register', function(req, res) {
    if (req.session.email) {
        res.sendFile(__dirname + "/" + "Proj.html");
    }
    res.sendFile(__dirname + "/" + "register.html");
});

app.post('/register',function(req,res){
	//To get the data sent in a post req , you just enter //req.body.<name of the input you want it’s value>
    if (req.session.email) {
        res.sendFile(__dirname + "/" + "Proj.html");
    }
    var userMail = req.body.mail;
    var userName = req.body.name;
    var userPass = req.body.userpassword;
	req.session.email = userMail;
    if (!validName(userName) || !validPassword(userPass) || takenMail(userMail) || !validEmail(userMail)) {
        var validname = true,validPass = true,validMail = true,usedMail = false;
		if (!validName(userName))
            validname = false;
        if (!validPassword(userPass))
			validPass = false;
		if(takenMail(userMail))
			usedMail = true;
		if(!validEmail(userMail))
			validMail = false;
		
		errorMessage = "<ul>" 
		if (!validname || !validPass || usedMail || !validMail){
			if(!validname)
				errorMessage += "<li>Invalid Username</li>";
			if(!validPass)
				errorMessage += "<li>Invalid Password</li>";
			if(!validMail)
				errorMessage += "<li>Invalid E-Mail</li>";
			if(usedMail)
				errorMessage += "<li>Mail is already taken!</li>";
			errorMessage += "</ul>";
			res.writeHead(200, {
                "Content-Type": "text/html"
            });
            res.write(
                "<html lang='en'> " +
                "<head> " +
					"<met charset='utf-8'>" +
                "</head>" +
				"<body>" +
					"<script type='text/javascript'>alert('"+ errorMessage + "'); window.history.back(); </script>" +
                "</body>" +
                "</html>");
            res.end();
			return;
        }
    }
    var newUser = {
		"name": userName,
        "email": userMail,
        "password": userPass,
        "completed": [],
        "archived": [],
        "inProgress": [],
        "allTasks": []
    };
	console.log(users.length);
	if(!users.length){
		fs.writeFileSync(__dirname + '/users.json', JSON.stringify(new Array(newUser), null, 4));
		file_content = fs.readFileSync(__dirname + '/users.json');
		users = JSON.parse(file_content);
	}
    else
	{
		users.push(newUser);
		fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users, null, 4));
	}
	res.sendFile(__dirname + "/" + "login.html");
});

app.get('/login', function(req, res) {
    if (req.session.email) {
        res.sendFile(__dirname + "/" + "Proj.html");
    }
    res.sendFile(__dirname + "/" + "login.html");
});

app.get('/read',function(req,res){
	file_content = fs.readFileSync(__dirname + '/users.json');
	users = JSON.parse(file_content);
	var index = getIndexLogin(req.session.email);
	res.send(users[index]);
	console.log(users[index].allTasks[0]);
	res.end();
});

app.post('/write',function(req,res){
	file_content = fs.readFileSync(__dirname + '/users.json');
    users = JSON.parse(file_content);
    var index = getIndexLogin(req.session.email);
    if(req.body.completed)
      users[index].completed = req.body.completed ;
    if(req.body.archived)
      users[index].archived = req.body.archived;
    if(req.body.inProgress)
      users[index].inProgress = req.body.inProgress;
    if(req.body.allTasks)
      users[index].allTasks = req.body.allTasks;
    fs.writeFileSync(__dirname + '/users.json', JSON.stringify(users, null, 5));
});

app.post('/login', function(req, res) {
    if (req.session.email) {
        res.sendFile(__dirname + "/" + "Proj.html");
    }
    var currEmail = req.body.mail; // sets sentEmail value to
    var currPass = req.body.userpassword;
	req.session.email = currEmail;
	console.log(users);
    if (users.length == 0 || !checkLoginMail(currEmail)) {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        res.write(
            "<!DOCTYPE html>" +
            "<html lang='en' dir='ltr'>" +
            "<head>" +
            "<met charset='utf-8'>" +
            "<title>Invalid mail</title>" +
            "</head>" +
            "<body>" +
            "<script type='text/javascript'>alert('Invalid Mail'); window.history.back(); </script>" +
            "</body>" +
            "</html>");
        res.end();
        return;
    }
    var index = getIndexLogin(req.session.email);
    var rightPass = users[index].password;
    if (rightPass != currPass) {
        res.writeHead(200, {
            "Content-Type": "text/html"
        });
        res.write(
            "<!DOCTYPE html>" +
            "<html lang='en' dir='ltr'>" +
            "<head>" +
            "<met charset='utf-8'>" +
            "<title>Invalid password</title>" +
            "</head>" +
            "<body>" +
            "<script type='text/javascript'>alert('Invalid password')</script>" +
            "</body>" +
            "</html>");
        res.end();
		return;
    }
    req.session.email = currEmail;
    res.redirect("/Proj");
});
app.get('/Proj',function(req,res){
	if (!req.session.email) {
        res.sendFile(__dirname + "/" + "login.html");
    }
	res.sendFile(__dirname + "/" + "Proj.html");
});
app.post('/logout', function(req,res) {
    req.session.destroy();
    res.redirect('/login');
});
function validEmail(mail) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(mail);
}

function validPassword(pass) {
    if (pass.length < 5) {
        return false;
    }
    return true;
}

function validName(name) {
	name = name.trim();
    if (name.length == 0)
        return false;
    for (i=0; i < name.length; i++) {
        if ( !((name[i] >= 'a' && name[i] <= 'z') || (name[i] >= 'A' && name[i] <= 'Z')) ) {
            return false;
        }
    }
    return true;
}

function takenMail(mail) {
    var i = 0;
    for (; i < users.length; i++) {
        if (users[i].email == mail) {
            return true;
        }
    }
    return false;
}
function checkLoginMail(temp) {
    for (var i = 0; i < users.length; i++){
        console.log(users[i].email)
		if (temp == users[i].email)
            return true;
	}
    return false;
}

function getIndexLogin(temp) {
    for (var i = 0; i < users.length; i++) {
        if (temp == users[i].email) {
            return i;
        }
    }
}

var server = app.listen(8081, function () {
	file_content = fs.readFileSync(__dirname + '/users.json');
	users = JSON.parse(file_content);	
	var host = server.address().address
	var port = server.address().port	
	console.log("app listening at http://%s:%s", host, port)
})


