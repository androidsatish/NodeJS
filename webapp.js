const http = require('http');
var url = require('url');
const hostname = 'localhost';
const port = 8082;
var mysql = require('mysql');
var formidable = require('formidable');
var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var conn  = mysql.createConnection({
  host : "localhost",
  user : "root",
  password : "satish",
  database :"testdb"
});

conn.connect(function(err) {
 if (err) {
   console.log(err);
 }
 else {
console.log("Connected To MySql !");
 }
});

app.listen(port, function() {
  console.log('Server running at http://localhost:8082/');
});
app.get('/index',function (req,res) {
  fs.readFile('index.html',function(err,data){
  res.writeHead(200,{'Content-type':'text/html'});
  res.write(data);
  res.end();
});

});

app.get('/getAllTeams',function(req,res){
  console.log("Recevied Group : "+req.query.grp);
  res.writeHead(200,{'Content-type':'application/json'});



  getAllTeams(res,req.query.grp);
});

app.get('/getAllGroups',function(req,res){
  res.writeHead(200,{'Content-type':'application/json'});
  getAllGroups(res);
});

app.get('/getPointsTable',function(req,res){
  res.writeHead(200,{'Content-type':'application/json'});
  getPointsTable(res);
});

app.get('/getVenues',function(req,res){
  res.writeHead(200,{'Content-type':'application/json'});

  getVenues(res);
});

app.get('/getAllMatches',function(req,res){
  console.log("Recevied Group : "+req.query.grp);
res.writeHead(200,{'Content-type':'text/plain'});
      getAllMatches(res,req.query.grp);
});

app.post('/login',function(req,res){
  console.log("Recevied Email : "+req.body.email);

    checkLogin(req.body,res);
});

app.post('/signup',function(req,res){
  console.log("Recevied Email : "+req.body.email);

    addUser(req.body,res);
});

app.post('/addMatch',function(req,res){
  console.log("Recevied Group : "+req.body.group);

  res.writeHead(200,{'Content-type':'application/json'});

    addMatchDetail(req.body,res);
});

app.post('/setMatchResult',function(req,res){
  console.log("Recevied MatchId : "+req.body.matchId);

  res.writeHead(200,{'Content-type':'application/json'});

  setMatchResult(req.body,res);

});

function getPointsTable(response) {
  var getTeamsQuery = "select * from pointsTable";

  conn.query(getTeamsQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":err};
      response.end(JSON.stringify(responseData));
    }else {

      if (result.length > 0) {
        responseData = {"status":true,"data":result};
        response.end(JSON.stringify(responseData));
      }else {
        responseData = {"status":false,"data":result};
        response.end(JSON.stringify(responseData));
      }
    }
  });
}

function setMatchResult(data,response) {
  var matchId = data.matchId;
  var op1Id = data.op1Id;
  var op2Id = data.op2Id;
  var winner = data.winner;
  var res = data.result;
  var looser
  var setResultQuery
  var values

  if (winner === '101') {
    values = [winner,res,matchId];
    setResultQuery = "update matches set isComplete = true, winner = ?,result = ? where matchId = ?";
  }else if (winner === '102') {
    values = [winner,res,matchId];
    setResultQuery = "update matches set isComplete = true, winner = ?,result = ? where matchId = ?";
  }else if (winner === op1Id) {
    looser = op2Id;
    values = [winner,res,winner,matchId];
    setResultQuery = "update matches set isComplete = true, winner = ?,result = ? ,winnerName = (select teamName from teams where teamId = ?) where matchId = ?";
  }else if (winner === op2Id) {
    looser = op1Id;
    values = [winner,res,winner,matchId];
    setResultQuery = "update matches set isComplete = true, winner = ?,result = ? ,winnerName = (select teamName from teams where teamId = ?) where matchId = ?";
  }

  conn.query(setResultQuery,values,function(err,result){
    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":"Internal Error","error":err};
      response.end(JSON.stringify(responseData));
    }else {
      console.log(result);
      if (result.affectedRows > 0) {
      // update points table
      if (winner === '101') {
        var tieQuery = "update pointsTable set played = played +1,tie = tie+1 where teamId = ? or teamId = ?";
        conn.query(tieQuery,[op1Id,op2Id],function(err,result){
          if (err) {
            console.log(err);
            responseData = {"status":false,"msg":"Internal Error","error":err};
            response.end(JSON.stringify(responseData));
          }else {
            console.log(result);
            if (result.affectedRows > 0) {
              responseData = {"status":true,"msg":"Match Result Updated Successfully !"};
              response.end(JSON.stringify(responseData));
            }else {
              responseData = {"status":false,"msg":"Tie Result not added"};
              response.end(JSON.stringify(responseData));
            }
          }
        });
      }else if (winner === '102') {
        var noResultQuery = "update pointsTable set played = played +1,noResult = noResult+1 where teamId = ? or teamId = ?";

        conn.query(noResultQuery,[op1Id,op2Id],function(err,result){
          if (err) {
            console.log(err);
            responseData = {"status":false,"msg":"Internal Error","error":err};
            response.end(JSON.stringify(responseData));
          }else {
            console.log(result);
            if (result.affectedRows > 0) {
              responseData = {"status":true,"msg":"Match Result Updated Successfully !"};
              response.end(JSON.stringify(responseData));
            }else {
              responseData = {"status":false,"msg":"No Result not added"};
              response.end(JSON.stringify(responseData));
            }
          }
        });
      }else {
        var wonQuery = "update pointsTable set played = played +1,won = won+1 where teamId = "+winner;
        var lostQuery = "update pointsTable set played = played +1,lost = lost+1 where teamId = "+looser;

        conn.query(wonQuery,function(err,result){
        if (err) {
          console.log(err);
          responseData = {"status":false,"msg":"Internal Error","error":err};
          response.end(JSON.stringify(responseData));
        }else {
          console.log(result);
          if (result.affectedRows > 0) {
            conn.query(lostQuery,function(err,result){
              if (err) {
                console.log(err);
                responseData = {"status":false,"msg":"Internal Error","error":err};
                response.end(JSON.stringify(responseData));
              }else {
                console.log(result);
                if (result.affectedRows > 0) {
                  responseData = {"status":true,"msg":"Match Result Updated Successfully !"};
                  response.end(JSON.stringify(responseData));
                }else {
                  responseData = {"status":false,"msg":"Lost Result not added"};
                  response.end(JSON.stringify(responseData));
                }
              }
            });
          }else {
            responseData = {"status":false,"msg":" Won Result not added"};
            response.end(JSON.stringify(responseData));
          }
        }
      });
    }
  }
  else{
    responseData = {"status":false,"msg":"Result not added"};
    response.end(JSON.stringify(responseData));
  }
}
});
}
function getAllMatches(response,groupId) {

  var selectQuery
  if (groupId === undefined) {
    console.log("Show All Matches");

    selectQuery = "select M.matchId,M.op1Id,M.op2Id,M.groupId,M.op1Name,M.op2Name,M.matchDate,M.venue,M.isComplete,M.winner,M.result,M.winnerName,T1.img as img1,T2.img as img2,G.groupName from matches M inner join groups G on M.groupId = G.groupId inner join teams T1 on M.op1Id = T1.teamId inner join teams T2 on M.op2Id = T2.teamId;";

  }else {
    console.log("Show matches from group "+groupId);

    selectQuery = "select M.matchId,M.op1Id,M.op2Id,M.groupId,M.op1Name,M.op2Name,M.matchDate,M.venue,M.isComplete,M.winner,M.result,M.winnerName,T1.img as img1,T2.img as img2,G.groupName from matches M inner join groups G on M.groupId = G.groupId  inner join teams T1 on M.op1Id = T1.teamId inner join teams T2 on M.op2Id = T2.teamId where M.groupId = "+groupId+" order by matchDate asc";
  }

  conn.query(selectQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":err};
      response.end(JSON.stringify(responseData));
    }else {
      if (result.length > 0) {
        responseData = {"status":true,"data":result};
        response.end(JSON.stringify(responseData));
      }else {
        responseData = {"status":false,"data":result};
        response.end(JSON.stringify(responseData));
      }

    }

  });

}
function addMatchDetail(data,response) {
  var groupId = data.group;
  var opponent1 = data.opponent1;
  var opponent2 = data.opponent2;
  var op1Name = data.op1;
  var op2Name = data.op2;
  var date = data.date+"T"+data.time;
  var venue = data.venue;

  var addMatchQuery = "insert into matches (groupId,op1Id,op2Id,matchDate,venue,op1Name,op2Name) values ?";
  var values = [[groupId,opponent1,opponent2,date,venue,op1Name,op2Name]];

  var chekMatchQuery = "select matchId,matchDate,venue from matches where op1Id = ? and op2Id = ? or (op2Id = ? and op1Id = ?)";

  conn.query(chekMatchQuery,[opponent1,opponent2,opponent1,opponent2],function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":"Internal Error","error":err};
      response.end(JSON.stringify(responseData));
    }else {
      console.log(result);
      if (result.length > 0) {
        responseData = {"status":false,"msg":"These teams are alredy having match on ","data":result};
        response.end(JSON.stringify(responseData));
      }else {
        conn.query(addMatchQuery,[values],function(err,result){

            if (err) {
              console.log(err);
              responseData = {"status":false,"msg":"Internal Error","error":err};
              response.end(JSON.stringify(responseData));
            }else {
              console.log(result);
              if (result.affectedRows > 0) {
                responseData = {"status":true,"msg":"Match Record Added Successfully !"};
                response.end(JSON.stringify(responseData));
              }else {
                responseData = {"status":false,"msg":"Record not added"};
                response.end(JSON.stringify(responseData));
              }
            }

        });

      }
    }


  });




}
function getAllGroups(response) {
  var getTeamsQuery = "select * from groups";

  conn.query(getTeamsQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":err};
      response.end(JSON.stringify(responseData));
    }else {

      if (result.length > 0) {
        responseData = {"status":true,"data":result};
        response.end(JSON.stringify(responseData));
      }else {
        responseData = {"status":false,"data":result};
        response.end(JSON.stringify(responseData));
      }
    }
  });

}
function getVenues(response){
  var getTeamsQuery = "select * from venues";

  conn.query(getTeamsQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":err};
      response.end(JSON.stringify(responseData));
    }else {

      if (result.length > 0) {
        responseData = {"status":true,"data":result};
        response.end(JSON.stringify(responseData));
      }else {
        responseData = {"status":false,"data":result};
        response.end(JSON.stringify(responseData));
      }
    }
  });
}
function getAllTeams(response,groupId){
  var getTeamsQuery
  if (groupId === undefined) {
    getTeamsQuery = "select * from teams";
  }else {
    getTeamsQuery = "select * from teams where groupId = "+groupId;
  }

  conn.query(getTeamsQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":err};
      response.end(JSON.stringify(responseData));
    }else {

      if (result.length > 0) {
        responseData = {"status":true,"data":result};
        response.end(JSON.stringify(responseData));
      }else {
        responseData = {"status":false,"data":result};
        response.end(JSON.stringify(responseData));
      }

    }

  });

}
function checkLogin(data,response) {

  var email = data.email;
  var password = data.password;

  if (email === undefined) {
    responseData = {"status":false,"msg":"Invalid email "};
    response.end(JSON.stringify(responseData));
  }else if (password === undefined) {
    responseData = {"status":false,"msg":"Invalid password "};
    response.end(JSON.stringify(responseData));
  }else {

    var sql = "select userId,firstName,lastName from users where email = ? AND password= ?";

   conn.query(sql,[email,password] ,function(err,result,fields){

      if (err) {
        console.log(err);
      }else {

        console.log(result);
        console.log(result.length);

          if (result.length>0) {

          responseData = {"status":true,"data":result};
            response.end(JSON.stringify(responseData));
          }else {

            responseData = {"status":false,"msg":"Failed ! Invalid email or password"};

            response.end(JSON.stringify(responseData));
          }

      }
    });
  }

}
function addUser(data,response) {

    var firstName = data.firstName;
    var lastName = data.lastName;
    var email = data.email;
    var password = data.password;

    if (firstName === undefined) {
      responseData = {"status":false,"msg":"Invalid firstName "};
      response.end(JSON.stringify(responseData));
    }else if (lastName === undefined) {
      responseData = {"status":false,"msg":"Invalid lastName "};
      response.end(JSON.stringify(responseData));
    }else if (email === undefined) {
      responseData = {"status":false,"msg":"Invalid email "};
      response.end(JSON.stringify(responseData));
    }else if (password === undefined || password == "") {
      responseData = {"status":false,"msg":"Invalid password "};
      response.end(JSON.stringify(responseData));
    }else {
      var insertQuery = "insert into users (firstName,lastName,email,password) values ?";
      var values = [[firstName,lastName,email,password]];

      var checkEmailQuery  = "select userId from users where email = ?";

      conn.query(checkEmailQuery,[email],function(err,result){

  if (err) {
    console.log(err);
    responseData = {"status":false,"msg":"Internal Error","error":err};
    response.end(JSON.stringify(responseData));
  }else {
    if (result.length>0) {
      responseData = {"status":false,"msg":"Email alredy exists"};
      response.end(JSON.stringify(responseData));
    }else {

      conn.query(insertQuery,[values],function(err,result){
        if (err) {
          console.log(err);
          responseData = {"status":false,"msg":"Internal Error","error":err};
          response.end(JSON.stringify(responseData));
        }else {
          console.log(result);
          if (result.affectedRows > 0) {
            responseData = {"status":true,"msg":"User Added Successfully !"};
            response.end(JSON.stringify(responseData));
          }else {
            responseData = {"status":false,"msg":"User not added"};
            response.end(JSON.stringify(responseData));
          }
        }

      });
    }
  }

});
}
}
