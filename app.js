const express = require('express');
const app = express();

app.use('/', express.static(__dirname + '/public'));

app.listen(8000, function(){
	console.log("[Sortable] Server is now running on port 8000");
});