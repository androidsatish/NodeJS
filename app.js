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

var responseData = {"status":true,"msg":"Successfull","email":"dummy@dummy","password":""};

const server = http.createServer((req, res) => {
var q = url.parse(req.url,true);
var data = q.query;
res.writeHead(200,{'Content-type':'application/json'});

if (req.method === 'POST') {
var jsonString = '';
  switch (q.pathname) {
    case "/login":

    req.on('data',function(data){
        jsonString += data;
        checkLogin(JSON.parse(jsonString),res);

    });

      break;
    case "/signup":
    req.on('data',function(data){
        jsonString += data;
        addUser(JSON.parse(jsonString),res);

    });
      break;
      case "/getAllUsers":
            getAllUsers(res);
        break;
      case "/deleteUser":
      req.on('data',function(data){
          jsonString += data;
          deleteUser(JSON.parse(jsonString),res);

      });
        break;

      case "/update":
      req.on('data',function(data){
          jsonString += data;
          updateUser(JSON.parse(jsonString),res);

      });

        break;

      case "/postExample":
        req.on('data',function(data){
            jsonString += data;

        });
        req.on('end',function(){
          console.log(JSON.parse(jsonString));
        });

        res.writeHead(200,{'Content-type':'text/plain'});

          res.end("POST action !");

        break;

    case "/fileupload":
      var form = new formidable.IncomingForm();
      form.parse(req,function(err,fields,files){

        if (err) {
          console.log(err);
        }else {

          var oldPath = files.filetoupload.path;
          var newPath = '/home/satishjampalwar/NodeJS/uploaded/'+ files.filetoupload.name;

          console.log(oldPath);
          console.log(newPath);

          fs.rename(oldPath,newPath,function(err){
              if (err) {
                console.log(err);
                res.writeHead(200,{'Content-type':'text/plain'});
                res.end("Error File Uploading");
              }else {
                res.writeHead(200,{'Content-type':'text/plain'});
                res.end("File Uploaded to "+ newPath);
              }
          });
          }

      });

      break;

    default:
    responseData = {"status":false,"msg":"Invalid URL "+q.pathname};
    res.end(JSON.stringify(responseData));
  }
}else {

//  res.writeHead(200,{'Content-type':'text/html'});
  // res.write('<form action="fileupload" method="post" enctype="multipart/form-data">');
  //  res.write('<input type="file" name="filetoupload"><br>');
  //  res.write('<input type="submit">');
  //  res.write('</form>');

  //  fs.readFile('index.html',function(err,data){

  if (q.pathname === "/getAllTeams") {

    getAllTeams(res);

  }else {

    res.writeHead(200,{'Content-type':'text/plain'});
    res.end("Use post request");

  }
}

}).listen(port);

function getAllTeams(response){

  var getTeamsQuery = "select * from teams";

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

function updateUser(data,response) {

  var firstName = data.firstName;
  var lastName = data.lastName;
  var email = data.email;
  var password = data.password;
  var userId = data.userId;

  var updateQuery

  if (password === undefined || password == "") {
    updateQuery = "update users set firstName = ? , lastName = ? , email = ? where userId = ?";

conn.query(updateQuery,[firstName,lastName,email,userId],function(err,result){

        if (err) {
          console.log(err);
          responseData = {"status":false,"msg":err};
          response.end(JSON.stringify(responseData));
        }else {
          console.log(result);
          if (result.affectedRows > 0) {
            responseData = {"status":true,"msg":"User Updated Successfully !"};
            response.end(JSON.stringify(responseData));
          }else {
            responseData = {"status":false,"msg":"Not Updated"};
            response.end(JSON.stringify(responseData));
          }
        }

});


  }else {
    updateQuery = "update users set firstName = ? , lastName = ? , email = ? , password = ? where userId = ?"

    conn.query(updateQuery,[firstName,lastName,email,password,userId],function(err,result){

            if (err) {
              console.log(err);
              responseData = {"status":false,"msg":err};
              response.end(JSON.stringify(responseData));
            }else {
              console.log(result);
              if (result.affectedRows > 0) {
                responseData = {"status":true,"msg":"User Updated Successfully !"};
                response.end(JSON.stringify(responseData));
              }else {
                responseData = {"status":false,"msg":"Not Updated"};
                response.end(JSON.stringify(responseData));
              }
            }

    });

  }

}

function deleteUser(data,response) {
  var email = data.email;

  if (email === undefined) {
    responseData = {"status":false,"msg":"please pass email parameter"};
    response.end(JSON.stringify(responseData));
  }else {

    var deleteQuery = "delete from users where email = ?";

    conn.query(deleteQuery,[email],function(err,result){

      if (err) {
        console.log(err);
      }else {
        console.log(result);
        if (result.affectedRows > 0) {
          responseData = {"status":true,"msg":"User deleted Successfully !"};
          response.end(JSON.stringify(responseData));
        }else {
          responseData = {"status":false,"msg":"email not found"};
          response.end(JSON.stringify(responseData));
        }
      }

    });

  }
}

function getAllUsers(response) {

  var getUsersQuery = "select * from users";

  conn.query(getUsersQuery,function(err,result){

    if (err) {
      console.log(err);
      responseData = {"status":false,"msg":"Internal Error","error":err};
      response.end(JSON.stringify(responseData));
    }else {

      responseData = {"status":true,"data":result};
      response.end(JSON.stringify(responseData));
    }

  });

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
