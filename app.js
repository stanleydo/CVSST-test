// For the HTTP server
const http = require('http');

// For reading files
const fs = require('fs');

// Options for Socket.IO
const options = {};

// IP Address and Port of the server
// 127.0.0.1 is localhost
const hostname = '13.57.203.51'; // EC2 server ip
const port = '80'; // Port 80 for HTTP # Need to convert to HTTPS for safe data transfer

// Create the HTTP Server
const server = http.createServer();

// Specify how it handles requests
server.on('request', (request, response) => {

    // Same as method = request.method and url = request.url
    const { method, url } = request

    // Removes the Favicon GET request (To make things cleaner)
    if (url === '/favicon.ico') {
        response.writeHead(204, {'Content-Type': 'image/x-icon'} );
        response.end();
        return;
    }

    // method is https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
    // Url is everything after and including the last slash in http://www.yourwebsite.com/
    console.log(method, " ON ", url)

    if (url === '/index.js') {
        response.writeHead(200, {'content-type': 'text/javascript'})
        fs.createReadStream('./public/index.js').pipe(response)
    } else {
        // Specifies the content of the response
        // In this case, we have a text/html response
        response.writeHead(200, { 'content-type': 'text/html' })
        fs.createReadStream('./public/index.html').pipe(response)
    }
});

// Use web sockets
const io = require('socket.io')(server, options);

let rooms = {};
let sockets = {};

// Do this when there is a socket connection attempt
io.on('connection', socket => {
    console.log("Connection formed with socket ID: ", socket.conn.id);
    socket.emit('connect');
    rooms[socket.id] = [];
    sockets[socket.id] = socket.id;

    // Same as above
    socket.on('joinRoom', function(room) {
        if (!(room in io.sockets.adapter.rooms)) {
            rooms[room] = [];
        }
        console.log("Joining room ", room);
        socket.join(room);

        console.log('Forcing removal of all existing entities...')
        socket.emit('clearEntities');

        console.log("Syncing current entities data with client...");
        console.log("Displaying Entities: ", rooms[room]);
        socket.emit('syncEntities', rooms[room]);

        console.log("Sending alert message to client for joining room: ", room);
        socket.emit('alert', 'Successfully joined Room : ' + room + ".");

    })

    socket.on('serverGetCurRoom', function(curRoom){
        sockets[socket.id] = curRoom;
    });

    socket.on('newEntity', function(cartesian) {
        console.log('New Entity Values: ', cartesian);
        socket.emit('getCurRoom');

        console.log('ROOM: ', sockets[socket.id])
        rooms[sockets[socket.id]].push(cartesian);
        // console.log('Current list of entities: ', entList);
        // console.log('Type of first entity: ', typeof(entList));
    })

    socket.on('addEntity', function(cartesian) {
        socket.to(sockets[socket.id]).emit('serverNewEntity', cartesian);
    })
});

server.listen(port, hostname, () => {
    // console.log(`Server running at http://${hostname}:${port}/`)
})