/** Imported modules */
var express = require("express");
var socketIO = require("socket.io");

var server = express();
var http = require("http").createServer(server);
var path = require("path");
var mysql = require("mysql2");
var fs = require("fs");
var cors = require("cors");

var io = require("socket.io")(http); //const io = require('socket.io').listen(server);
var sequelize = require("sequelize");
var bcrypt = require("bcryptjs");
var uuid = require("uuid/v4");

var session = require("express-session");
var cookieParser = require("cookie-parser");

/** Server Modules */
var request = require("./modules/request.js");
var db = require("./modules/database.js")(bcrypt, sequelize);
var io_control = require("./modules/io_control.js")(io, db, sequelize);

/** Page Control Modules */
var PageConfig = require("./modules/page/PageConfig.js");
var CommonItems = require("./modules/page/CommonItems.js");

server.set("view engine", "ejs");
server.set("views", __dirname);
server.use(express.urlencoded({ extended: true }));

// server.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
server.use(cors());

// server.use(express.static(__dirname));
io.origins("*:*");

server.use(cookieParser());
server.use(
  session({
    secret: "boa8curn2o389nca2o389craop2cr8938ryap2pq83ryqcne",
    key: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 600000
    }
  })
);
const Port = process.env.PORT || 3000;
// must be app otherwise socket.io will not work
http.listen(Port);

// -------------------
// end init
// -------------------

io.on("connection", function(socket) {
  console.log(true);
});

server.get("/versions/*", (req, res) => {});

server.post("/demo/chat/signup", (req, res) => {
  /** type == false means a applicant, true a company */
  if (req.body.type == "false") {
    //console.log(req.body);
    db.applicants
      .build({
        uuid: uuid(),
        email: req.body.email,
        password: req.body.password,
        first_name: req.body.first_name,
        middle_name: req.body.middle_name,
        surname: req.body.surname,
        traits: JSON.stringify(["Applicant Description", "trait1", "trait2"])
      })
      //db.applicants.build({
      //uuid:       uuid(),
      // email:      req.body.email,
      //     password:   req.body.password,
      //      first_name: req.body.first_name,
      //      middle_name:req.body.middle_name,
      //      surname:    req.body.surname,
      //       traits:     JSON.stringify(["Applicant Description", "trait1", "trait2"])
      //  })
      .save()
      .then(function(user) {
        req.session.user = user.dataValues;
        req.session.save();
        res.send({
          status: "LoggedIn",
          cookies: { uuid: user.uuid, type: "applicant" }
        });
      })
      .catch(error => {
        console.log(error);
        res.send("/beta/chat/signup");
      });
  } else {
    //        db.companies.build({
    //            uuid:       uuid(),
    //            email:      req.body.email,
    //            password:   req.body.password,
    //            name:       "boring",//req.body.name,
    //            kvk:        "kjh23o7rh2c",//req.body.kvk,
    //            traits:     JSON.stringify(["Company Description", "trait1", "trait2"]),
    //        })
    db.companies
      .build({
        uuid: uuid(),
        email: req.body.email,
        password: req.body.password,
        name: req.body.name,
        phone: req.body.phone,
        company_description: req.body.company_description,
        amount_vacancies: req.body.amount_vacancies,
        company_type: req.body.company_type,
        company_size: req.body.company_size,
        traits: req.body.company_traits,
        location: req.body.location,
        sector: req.body.sector
      })
      .save()
      .then(function(user) {
        req.session.user = user.dataValues;
        req.session.save();
        res.send({
          status: "LoggedIn",
          cookies: { uuid: user.uuid, type: "company" }
        });
      })
      .catch(error => {
        console.log(error);
        res.send(error);
      });
  }
});

server.post("/demo/chat/signin", (req, res, next) => {
  /** first check whether the email belongs to a applicant, then to a user */
  // the value of type shows wether it is an applicant or a company
  if (req.body.type == "applicant") {
    db.applicants
      .findOne({ where: { email: req.body.email } })
      .then(function(user) {
        if (!user) {
          res.send({ status: "NoUser" });
        } else if (!user.validPassword(req.body.password)) {
          res.send({ status: "WrongPassword" });
        } else {
          req.session.user = user.dataValues;
          req.session.save();
          res.send({
            status: "LoggedIn",
            cookies: { uuid: user.uuid, type: "company" }
          });
        }
      });
  } else if (req.body.type == "company") {
    db.companies
      .findOne({ where: { email: req.body.email } })
      .then(function(user) {
        if (!user) {
          res.send({ status: "NoUser" });
        } else if (!user.validPassword(req.body.password)) {
          res.send({ status: "WrongPassword" });
        } else {
          req.session.user = user.dataValues;
          req.session.save();
          res.send({
            status: "LoggedIn",
            cookies: { uuid: user.uuid, type: "company" }
          });
        }
      });
  }
});
server.post("/demo/signin_phone", (req, res, next) => {
  /** first check whether the email belongs to a applicant, then to a user */
  db.applicants
    .findOne({ where: { email: req.body.email } })
    .then(function(user) {
      /** If an applicant with the email is not found, try the companies */
      if (!user) {
        db.companies
          .findOne({ where: { email: req.body.email } })
          .then(function(user) {
            if (!user) {
              res.send({ status: "NoUser" });
            } else if (!user.validPassword(req.body.password)) {
              res.send({ status: "WrongPassword" });
            } else {
              req.session.user = user.dataValues;
              req.session.save();
              res.send({
                status: "LoggedIn",
                cookies: { uuid: user.uuid, type: "company" }
              });
            }
          });
      } else if (!user.validPassword(req.body.password)) {
        res.send({ status: "WrongPassword" });
      } else {
        req.session.user = user.dataValues;
        req.session.save();
        res.send({
          status: "LoggedIn",
          cookies: { uuid: user.uuid, type: "applicant" }
        });
      }
    });
});

var sessionChecker = (req, res, next) => {
  if (req.session.user && req.cookies.sid) {
    next();
  } else {
    res.redirect("/demo/chat/signin");
  }
};
server.get("/", (req, res, next) => {
  if (req.session.user && req.cookies.sid) {
    console.log("user logged in ");
    res.redirect("/demo/chat/signin");
    // next();
  } else {
    console.log("user not logged in ");

    res.redirect("/demo/chat/signin");
  }
});

server.get("/demo/chat", (req, res, next) => {
  if (req.session.user && req.cookies.sid) {
    next();
  } else {
    res.redirect("/demo/chat/signin");
  }
});
server.get("/demo/chat", sessionChecker, (req, res, next) => {
  next();
});
/*server.get('/demo/chat/phone',(req,res,next)=>{
    if (req.session.user && req.cookies.sid) {
        next();
    } else {
        res.redirect('/demo/chat/signin_phone');
    }
})*/
server.get("/demo/chat/phone", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/chat/phone.ejs");
});
server.get("/demo/chat/signin_phone", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/chat/signin_phone.ejs");
});
server.get("/demo/chat/eye.svg", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/chat/eye.svg");
});
server.get("/demo/chat/logo.png", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/chat/logo.png");
});
server.get("/demo/css/shared/common.css", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/css/shared/common.css");
});
server.get("/demo/chat/signin.css", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/css/signin.css");
});
server.get("/demo/css/shared/build.css", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/css/shared/build.css");
});
server.get("/demo/css/chat/index.css", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/css/chat/index.css");
});
server.get("/demo/js/chat.js", (req, res, next) => {
  console.log("getting chat.js");
  res.sendFile(__dirname + "/www/demo/js/chat.js");
});
server.get("/demo/js/chat", (req, res, next) => {
  console.log("getting chat.js");
  res.sendFile(__dirname + "/www/demo/js/chat.js");
});
server.get("/demo/js/common.js", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/common.js");
});
server.get("/demo/js/init.js", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/init.js");
});
server.get("/demo/js/libtouch.js", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/libtouch.js");
});
server.get("/demo/js/socket.io.min.js", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/socket.io.min.js");
});
server.get("/demo/js/jquery", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/jquery.js");
});
server.get("/demo/chat/jquery.js", (req, res, next) => {
  res.sendFile(__dirname + "/www/demo/js/jquery.js");
});
// no extension in the url means a page
server.get("/*", (req, res, next) => {
  let req_file = __dirname + "/www" + req.url;
  console.log("calling wildcard");
  if (request.validate(req.url)) {
    // check whether the file exist
    req_file += req.url.slice(-1) == "/" ? "index.ejs" : ".ejs";

    let document_data = {
      _header: __dirname + "/views/header",
      _footer: __dirname + "/views/footer",
      _request_url: req.url,
      common: new CommonItems(),
      page: new PageConfig()
    };
    fs.readFile(req_file, function(err, data) {
      if (err) {
        res.status(404);
        res.render(request.error_code._404, document_data);
      } else res.render(request.parse(req.url, request.error_code), document_data);
    });
  } else next();
});
server.get("/socket.io/*", (req, res, next) => {
  console.log(__dirname + "/demo" + req.url);
  res.sendFile(__dirname + "/demo" + req.url);
});
server.use(express.static(path.join(__dirname, "/www/demo")));
