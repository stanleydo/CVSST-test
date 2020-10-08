// For the HTTP server
const http = require('http');

// For reading files
const fs = require('fs');

// Options for Socket.IO
const options = {};

// IP Address and Port of the server
// 127.0.0.1 is localhost
const hostname = '127.0.0.1';
const port = '8080';

// Create the HTTP Server
const server = http.createServer();

// Specify how it handles requests
server.on('request', (request, response) => {

    // Same as method = request.method and url = request.url
    const { method, url } = request
    const { headers } = request

    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
    console.log("Method: ", method)

    // Everything after the last slash in http://www.yourwebsite.com/
    console.log("Url: ", url)

    // Host, connection type, etc.
    console.log("Headers: ", headers)

    // Specifies the content of the response
    // In this case, we have a text/html response
    response.writeHead(200, { 'content-type': 'text/html' })
    fs.createReadStream('index.html').pipe(response)
});

// Use web sockets
const io = require('socket.io')(server, options);

// Do this when there is a socket connection attempt
io.on('connection', socket => {
    console.log("Connection from: ", socket.client);

    // When there is a command called 'hello' sent from the client, it does the function
    socket.on('hello', function (data) {
        console.log(data);
    })

    // When there is a command called 'changeTitle' sent from the client, it does the function
    socket.on('changeTitle', function (data) {
        console.log('CHANGE TITLE??');
        socket.emit('changeTitle', data);
    })

    // Same as above
    socket.on('joinRoom', function(data) {
        socket.join(data);
        socket.emit('alert', 'You joined room: ' + data);
        console.log("Socket Rooms: ", socket.rooms);
    })
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`)
})