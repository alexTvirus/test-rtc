const nodeDataChannel = require('node-datachannel');
var net = require("net");
var WebSocket = require('rpc-websockets').Client
const { Worker } = require("worker_threads");
const WebSocket1 = require('ws');
// import * as common from './common.js';
var common = require('./common.js');
const readline = require("readline");
//const fs = require('fs');
const axios = require('axios');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

var server = net.createServer()

class Queue {
    constructor() {
        this.items = {}
        this.frontIndex = 0
        this.backIndex = 0
    }

    enqueue(item) {
        this.items[this.backIndex] = item
        this.backIndex++
    }

    dequeue() {
        const item = this.items[this.frontIndex]
        delete this.items[this.frontIndex]
        this.frontIndex++
        return item
    }

    peek() {
        return this.items[this.frontIndex]
    }

    get printQueue() {
        return this.items;
    }

    get length() {
        let i = 0;
        for (var p in socketQueue.items) {
            i++;
        }
        return i;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}


function randomId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

//--------------------------------
var global_caller
var isPeerConnect = false


function workerPeer() {
    let isFirst = true
    var ws = new WebSocket1('ws://localhost:3000/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        }
    })

    function randomId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    var id, room
    var isConnect = false;
    id = randomId(16);
    var gdc;
    var peerId = id;

    function publish(destination, content) {
        ws.send(JSON.stringify({
            type: 'publish',
            destination: destination,
            content: content
        }));
    }

    function subscribe(destination) {
        ws.send(JSON.stringify({
            type: 'subscribe',
            destination: destination
        }));
    };

    function endCall() {
        room = undefined;
        try {
            global_caller.close();
        } catch (err) {

        }
    }

    function endCurrentCall() {
        publish('client-endcall', {
            "room": room,
            "is_server": true
        })
        endCall();
    }

    var client_response;

	function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
	
	let guid = () => {
			let s4 = () => {
				return Math.floor((1 + Math.random()) * 0x10000)
					.toString(16)
					.substring(1);
			}
			//return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		}

    function makeConnection(peerId) {

        global_caller = createPeerConnection(peerId);

        gdc = global_caller.createDataChannel(guid(),{
            // negotiated:true,
            id: 0,
            portRangeBegin: 5000,
            portRangeEnd: 9999,
        });

        room = peerId
    }

    function createPeerConnection(peerId) {

        // Create PeerConnection
        ////console.log(' createPeerConnection  ', peerId);
        let peerConnection = new nodeDataChannel.PeerConnection('pc', { iceServers: [] });
        peerConnection.onStateChange((state) => {
            if (state == 'connected') {
                isPeerConnect = true

                try {
                    ws.close();
                } catch (e) {
                    console.log(e);
                }
            }
            if (state == 'disconnected') {

                try {
                    
                } catch (e) {
                    console.log(e);
                }
            }
            if (state == 'closed') {
                try {
                   
                } catch (e) {
                    console.log(e);
                }
            }
            console.log('peer State: ', state);
        });
        peerConnection.onGatheringStateChange((state) => {
            // console.log('GatheringState: ', state);
            if(state == "complete"){
					let desc = peerConnection.localDescription();
                    // desc = JSON.parse();
                    // let temp = descriptions
                    // for(let i=0 ; i < candidates.length ; i++){
                    //     temp = temp + candidates[i]+"\r\n"
                    // }
                    //  console.log(temp)
                    // let object = Object.assign(
                    //   {},
                    //   { sdp: temp },
                    //   { type:  "offer"}
                    // );
                    publish("client-sdp", {
                        "description": JSON.stringify(desc),
                        "room": peerId,
                        "is_client": true,
                        "from": id,
                        "type": "offer"
                        })
                    // rl.question('## Please copy/paste the answer provided by the browser: \n', (sdp) => {
                    //     let sdpObj = JSON.parse(sdp);
                    //     publish("client-sdp", {
                    //     "description": JSON.stringify(sdpObj),
                    //     "room": peerId,
                    //     "is_client": true,
                    //     "from": id,
                    //     "type": "offer"
                    //     })

                    //     rl.close();
                    // });


                    
            }
        
        });

        return peerConnection;
    }


    ws.on('open', function() {
        // pussher
        if (isFirst) {
            isFirst = false

            //ws.notify('client-add-prepare-client', {
            //    "id": id
            //})

            axios.get(`http://localhost:8000/peer/id/${id}`)

            console.log("id ", id)

            subscribe('client-add-new-server')
            subscribe('client-add-complete-server')
            subscribe('server-candidate')
            subscribe('server-answer')


        }
    })

    ws.on('message', (responseData) => {
        var parsed = JSON.parse(responseData);

        if (parsed.match.includes("client-add-new-server")) {
            ////console.log(answer.client_id)
            if (parsed.content.client_id == id) {
                makeConnection(parsed.content.server_id)
            }
        }

        if (parsed.match.includes("server-candidate")) {
            if (!isConnect && parsed.content.is_server && parsed.content.room == room) {
                // add addRemoteCandidate
                try {
                    global_caller.addRemoteCandidate(parsed.content.candidate, parsed.content.mid);
                } catch (e) {}
            }

        }

        if (parsed.match.includes("client-add-complete-server")) {
            if (parsed.content.client_id == id) {
                publish('client-add-new-client', {
                    "id": id
                })
            }
        }

        if (parsed.match.includes("server-answer")) {
            // room = id server
            //console.log("server-answer  " + answer.is_server + " " + answer.room + " " + room);
            if (parsed.content.is_server && parsed.content.room == room) {
                // add addRemoteCandidate
                // console.log("server-answer");
				// console.log(JSON.stringify(parsed.content.type));
                // console.log(JSON.stringify(parsed.content.description));
                global_caller.setRemoteDescription(parsed.content.description, parsed.content.type);
            }

        }

    })

}



function worker(socket,id_peer) {
    let isFirst = true
    var ws = new WebSocket1('ws://localhost:3000/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        }
    })

    function randomId(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    var id, room, caller;
    var isConnect = false;
    id = randomId(16);
    var gdc = null;
    var peerId;

    function publish(destination, content) {
        ws.send(JSON.stringify({
            type: 'publish',
            destination: destination,
            content: content
        }));
    }

    function subscribe(destination) {
        ws.send(JSON.stringify({
            type: 'subscribe',
            destination: destination
        }));
    };

    function endCall() {
        room = undefined;
        try {
            socket.destroy();
            gdc.close();
        } catch (err) {

        }
    }

    function endCurrentCall() {
        publish('client-endcall', {
            "room": room,
            "is_server": true
        })
        endCall();
    }

    var client_response;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    let guid = () => {
            let s4 = () => {
                return Math.floor((1 + Math.random()) * 0x10000)
                    .toString(16)
                    .substring(1);
            }
            //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
            return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
        }

	var timeout = false

    function makeConnection(peerId) {

        gdc = global_caller.createDataChannel(guid(),{
            negotiated:true,
            id: peerId,
            portRangeBegin: 5000,
            portRangeEnd: 9999,
        });

        room = peerId

        gdc.onMessage((msg) => {
            console.log(msg.length)
            if (msg.length == 1) {
                try {
                    
                    socket.destroy();
                    gdc.close();
                } catch (err) {
                    console.log(err)
                }
            } else if((msg.length == 2 && msg[0] == 45)){
                socket.write(client_response);   
            }

            else {
                try {
                    socket.write(msg);
                } catch (err) {
                    console.log(err)
                }
                
            }
        });

        gdc.onClosed(() => {
            try {
                    console.log("onClosed")
                    if(gdc.isOpen())
                        gdc.sendMessageBinary(Buffer.from([0]));
                    arrayIds[id_peer] = true
                    socket.destroy();
                } catch (err) {
                    console.log(err)
                }
        })

        gdc.onOpen(() => {
            try {
                    if(gdc.isOpen()){
                        axios.get(`http://localhost:8000/id/${id_peer}`)
                    }

                } catch (err) {
                    console.log(err)
                }
        });

    }

    function ListenDataFromSocket() {

                try {
                    ws.close();
                } catch (e) {
                    console.log(e);
                }
                socket
                    .on("data", function(msg) {
                        ////console.log(msg)
                        var socks_version = msg[0];
                        if (!socket.address5 && socks_version === 5 && (msg.length == 3 || msg.length == 4)) {
                            try {
                                //console.log(msg)
                                socket.write(Buffer.from([5, 0]));
                            } catch (e) {}
                        } else {
                            if (!socket.address5) {
                                // gdc.onMessage((msg) => {
                                //  //console.log("onMessage 2");
                                // });
                                // lấy ip/port từ message socket
                                var address_type = msg[3];
                                var address5 = readAddress(address_type, msg.slice(4));
                                var response = Buffer.from(msg);
                                response[1] = 0;
                                client_response = response
                                // try {
                                //     socket.write(response);
                                // } catch (e) {}
                                //console.log(address5);
                                socket.address5 = address5;
                                // gửi address / port sang server , thông qua udp

                                try {
                                    // console.log("send 1")
                                    
                                    gdc.sendMessageBinary(Buffer.from("-1"+socket.address5.address + ":" + socket.address5.port));
                                } catch (e) {}
                            } else {
                                // gửi data sang server thông qua udp
                                try {
                                    // console.log("send 2")
                                    gdc.sendMessageBinary(msg);
                                } catch (e) {}


                            }
                        }
                    })


    }


    ws.on('open', function() {
        // pussher
        if (isFirst) {
            isFirst = false
            console.log("id ", parseInt(id_peer))
            makeConnection(parseInt(id_peer))
            subscribe('server_data_channel_opened')


            socket.on("error", (err)=> {
                        console.error("socket error: %s", err.message);
                         try {
                            socket.destroy(); // is this unnecessary?
                        } catch (e) {
                            console.log(e)
                        }
                    })

                 socket.on("close", ()=> {
                        try {
                            // neu nodeDataChannel open thi send 
                            if(gdc && gdc.isOpen()){
                                gdc.sendMessageBinary(Buffer.from([0]));
                                gdc.close();
								arrayIds[id_peer] = true
                            }

                        } catch (e) {
                            console.log(e);
                        }
                        
                        
                    })

                 socket.on('timeout', () => {
                        try {
						
                            socket.destroy(); // is this unnecessary?
                        } catch (e) {
                            console.log(e)
                        }
                    })
        }
    })

    ws.on('message', (responseData) => {
        var parsed = JSON.parse(responseData);
        // console.log(parsed)
        if (parsed.match.includes("server_data_channel_opened")) {
            
            if (parsed.content.client_id == id_peer) {
                ListenDataFromSocket()
            }
        }

    })

}
//---------------

var arrayIds = {}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function setUp(){
    for(let i=1 ; i < 1022 ; i++){
        arrayIds[i] = true
    }
}

setUp()
workerPeer()

function controller(socket){
    let id = -1
    for (var key in arrayIds) {
        if (arrayIds[key]){
            id = key
            arrayIds[key] = false
            break;
        }
    }
    if (id == -1)
        try{
             socket.on("error", ()=> {
                        
                    })
              socket.on("close", ()=> {
                        
                    })
               socket.on("timeout", ()=> {
                        
                    })
               socket.destroy()

            
        }catch(e){

        }
        
    else
        worker(socket,id)
}

//--------------------------------

function formatIPv4(buffer) {
    // buffer.length == 4
    return buffer[0] + "." + buffer[1] + "." + buffer[2] + "." + buffer[3];
}

function formatIPv6(buffer) {
    // buffer.length == 16
    var parts = [];
    for (var i = 0; i < 16; i += 2) {
        parts.push(buffer.readUInt16BE(i).toString(16));
    }
    return parts.join(":");
}

function readAddress(type, buffer) {
    if (type == 1) {
        // IPv4 address
        return {
            family: "IPv4",
            address: formatIPv4(buffer),
            port: buffer.readUInt16BE(4),
        };
    } else if (type == 3) {
        // Domain name
        var length = buffer[0];
        return {
            family: "domain",
            address: buffer.slice(1, length + 1).toString(),
            port: buffer.readUInt16BE(length + 1),
        };
    } else if (type == 4) {
        // IPv6 address
        return {
            family: "IPv6",
            address: formatIPv6(buffer),
            port: buffer.readUInt16BE(16),
        };
    }
}


// var socketQueue = new Queue();


// setInterval(() => {
//         //console.log(socketQueue.length)
//         if (socketQueue.length < 1) {
//             return;
//         }
//         worker(socketQueue.dequeue())
//     },
//     500 // execute the above code every 10ms
// )


var counter = 0


//server.maxConnections = 15
server.on("connection", function(socket) {
        // if (socketQueue.length < 200) {
        //     socketQueue.enqueue(socket);
        // } else {
        //     console.log("30 " + socketQueue.length)
        //     socket.end()
        // }
        //console.log(counter)
        socket.setTimeout(15000);
        let x = controller(socket)
    })
    .
on("listening", function() {
        var address = this.address();
        console.log(
            "server listening on tcp://%s:%d",
            address.address,
            address.port
        );
    })
    .on("error", function(err) {
        console.error("server error: %j", err);
    });

var port = parseInt(1101, 10);
var host = process.env.HOST || "localhost";
server.listen(port, host);