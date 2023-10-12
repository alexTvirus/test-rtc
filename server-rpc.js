var WebSocketServer = require('rpc-websockets').Server

var server = new WebSocketServer({
  port: 8080,
  host: 'localhost'
})



// create an event
server.event("client-add-prepare-client")

server.event("client-add-new-client")

server.event("client-add-new-server")

server.event("client-add-complete-server")


server.event("client-endcall")

server.event("client-candidate")

server.event("client-sdp")

server.event("client-answer")



// get events
console.log(server.eventList())

// emit an event to subscribers

// setTimeout(()=>{
// 	server.emit('feedUpdated',{id:0})
// }, 5000)


server.register("client-add-prepare-client", function(obj)
{
    server.emit('client-add-prepare-client',obj)
})

server.register("client-add-new-client", function(obj)
{
    server.emit('client-add-new-client',obj)
})

server.register("client-add-new-server", function(obj)
{
    server.emit('client-add-new-server',obj)
})

server.register("client-add-complete-server", function(obj)
{
    server.emit('client-add-complete-server',obj)
})

server.register("client-endcall", function(obj)
{
    server.emit('client-endcall',obj)
})

server.register("client-candidate", function(obj)
{
    server.emit('client-candidate',obj)
})

server.register("client-sdp", function(obj)
{
    server.emit('client-sdp',obj)
})

server.register("client-answer", function(obj)
{
    server.emit('client-answer',obj)
})