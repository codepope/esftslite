var express = require('express');
var bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch'),
  esClient = new elasticsearch.Client({
    host: process.env.ES_URL
  });

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


esClient.indices.exists({
  index: "textstore"
}, function(err, response, status) {
  if (status == 404) {
    esClient.indices.create({
      index: "textstore"
    }, function(err, response, status) {
      if(err) {
        console.log(err)
        process.exit(1)
      }
      console.log("Created index "+response);
    });
  }
  app.listen(3000);
});

app.get("/", function(req, res) {
  res.sendfile("./views/index.html");
});

app.get("/add", function(req, res) {
  res.sendfile('./views/add.html');
});

app.post("/add", function(req, res) {
  esClient.create({
    index: 'textstore',
    type: 'basicdoc',
    body: {
      document: req.body.newDocument,
      created: new Date()
    }
  }, function(err, result, status) {
    if (err == null) {
      res.sendfile("./views/add.html");
    } else {
      res.send("Error:" + err);
    }
  });
});


app.get("/search", function(req, res) {
  res.sendfile('./views/search.html');
});

app.post("/search", function(req, res) {
  esClient.search({
      index: 'textstore',
      body: {
        query: {
          match: {
            document: req.body.query
          }
        }
      }
    },
    function(err, response, status) {
      res.send(pagelist(response.hits.hits));
    });
});

function pagelist(items) {
  result = "<html><body><ul>";
  items.forEach(function(item) {
    itemstring = "<li>" + item._id +
      "<ul><li>" + item._score +
      "</li><li>" + item._source.created +
      "</li><li>" + item._source.document +
      "</li></ul></li>";
    result = result + itemstring;
  });
  result = result + "</ul></body></html>";
  return result;
}
