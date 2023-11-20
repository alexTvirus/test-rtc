const nodeDataChannel = require('node-datachannel');
var net = require("net");
var WebSocket = require('rpc-websockets').Client
const {Worker} = require("worker_threads");
const WebSocket1 = require('ws');
// import * as common from './common.js';
const common = require('./common.js');
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


//--------------------------------
var global_caller
var isPeerConnect = false
var global_ws_data
const PORT = 1101
const numberChannel = 50

//---------------------

// tao peer connection
function workerPeer(callback) {
    let isFirst = true
    var ws = new WebSocket1('ws://chain-zircon-anaconda.glitch.me/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        }
    })


    var id, room
    var isConnect = false;
    id = common.randomId(16);
    var gdc;
    var peerId = id;
    var client_response;


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


    function makeConnection(peerId) {

        global_caller = createPeerConnection(peerId);

        gdc = global_caller.createDataChannel(common.guid(), {
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
        let peerConnection = new nodeDataChannel.PeerConnection('pc', {
            iceServers: ['stun:stun.l.google.com:19302']
        });
        peerConnection.onStateChange((state) => {
            if (state == 'connected') {
                isPeerConnect = true
                callback()
                try {
                    ws.close();
                } catch (e) {
                    console.log(e);
                }
            }
            // if (state == 'disconnected') {
            // }
            // if (state == 'closed') {
                
            // }
            console.log('peer State: ', state);
        });
        peerConnection.onGatheringStateChange((state) => {
            // console.log('GatheringState: ', state);
            if (state == "complete") {
                let desc = peerConnection.localDescription();
                publish("client-sdp", {
                    "description": JSON.stringify(desc),
                    "room": peerId,
                    "is_client": true,
                    "from": id,
                    "type": "offer"
                })
            }

        });

        return peerConnection;
    }


    ws.on('open', function () {
        // pussher
        if (isFirst) {
            isFirst = false

            publish('client-add-prepare-client', {
               "id": id
            })

            // axios.get(`http://localhost:8000/peer/id/${id}`)
            //     .then((data) => {
            //         console.log("axios success: ");
            //     })
            //     .catch((error) => {
            //         console.log("axios error: " + error);
            //     });

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
                } catch (e) {
                }
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

// tao cac datachannel
class WorkerData {

    id_peer
    socket = null
    isFirst = true
    ws = null
    id
    room
    caller
    isConnect = false;
    isUsed = false;

    gdc = null;
    peerId;
    client_response;
    timeout = false

    // chay lan dau tao gdc
    setUp() {
        this.id = common.randomId(16);

        this.ws = new WebSocket1('ws://chain-zircon-anaconda.glitch.me/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            }
        })

        let out = this
        this.ws.on('open', function () {
            // pussher
            if (out.isFirst) {
                out.isFirst = false
                //console.log("id ", parseInt(id_peer))
                out.makeConnection(parseInt(out.id_peer))
                out.subscribe('server_data_channel_opened')
                // out.setUpSocket()
            }
        })
        this.ws.on('message', function (responseData) {
            var parsed = JSON.parse(responseData);

            if (parsed.match.includes("server_data_channel_opened")) {

                if (parsed.content.client_id == out.id_peer) {
                    try {
                        out.ws.close();
                    } catch (e) {
                        console.log(e);
                    }
                    out.isConnect = true
                }
            }

        })
    }


    // setup , nhan du lieu cua datachannel
    // trar du lieu cua datachannel ve socket
    setUpData() {
        let out = this
        this.gdc.onMessage((msg) => {
            // console.log(msg)
            if (msg.length == 1) {
                try {
                    // if (out.gdc.isOpen())
                    //     out.gdc.sendMessageBinary(Buffer.from([0]));
                    // console.log(`closed ${out.id_peer}`)
                    out.isUsed = false
                    out.socket.destroy();
                } catch (err) {
                    console.log(err)
                }
            } else if ((msg.length == 2 && msg[0] == 45)) {

                out.socket.write(out.client_response);
            } else {
                try {
                    out.socket.write(msg);
                } catch (err) {
                    console.log(err)
                }

            }
        });

        this.gdc.onClosed(() => {
            try {
                // console.log("onClosed")
                if (out.gdc.isOpen())
                    out.gdc.sendMessageBinary(Buffer.from([0]));
                out.socket.destroy();
            } catch (err) {
                console.log(err)
            }
        })

        this.gdc.onOpen(() => {
            try {
                if (out.gdc.isOpen()) {
                    console.log(`${out.id_peer}`)
                    global_ws_data.send(JSON.stringify({
                        method: 'client',
                        id: out.id_peer
                    }));
                    // axios.get(`http://localhost:8000/id/${out.id_peer}`)
                }

            } catch (err) {
                console.log(err)
            }
        });

    }

    setUpSocket() {
        let out = this
        out.socket.on("error", (err) => {
            console.error("socket error: %s", err.message);
            try {
                out.socket.destroy(); // is this unnecessary?
            } catch (e) {
                console.log(e)
            }
        })

        out.socket.on("close", () => {
            try {
                out.gdc.sendMessageBinary(Buffer.from([0]));
            } catch (e) {
                console.log(e);
            }


        })

        out.socket.on('timeout', () => {
            try {

                out.socket.destroy(); // is this unnecessary?
            } catch (e) {
                console.log(e)
            }
        })
    }


    publish(destination, content) {
        this.ws.send(JSON.stringify({
            type: 'publish',
            destination: destination,
            content: content
        }));
    }

    subscribe(destination) {
        this.ws.send(JSON.stringify({
            type: 'subscribe',
            destination: destination
        }));
    };

    makeConnection(peerId) {

        this.gdc = global_caller.createDataChannel(common.guid(), {
            negotiated: true,
            id: parseInt(this.id_peer),
            portRangeBegin: 5000,
            portRangeEnd: 9999,
        });

        this.room = parseInt(this.id_peer)

        this.setUpData()
    }

    // setup , nhan du lieu tu socket
    // truyen du lieu tu socket sang datachannel
    ListenDataFromSocket() {
        let out = this
        out.isUsed = true
        console.log(`use ${out.id_peer}`)
        this.socket
            .on("data", function (msg) {
                ////console.log(msg)
                var socks_version = msg[0];
                if (!out.socket.address5 && socks_version === 5 && (msg.length == 3 || msg.length == 4)) {
                    try {
                        //console.log(msg)
                        out.socket.write(Buffer.from([5, 0]));
                    } catch (e) {
                    }
                } else {
                    if (!out.socket.address5) {
                        // gdc.onMessage((msg) => {
                        //  //console.log("onMessage 2");
                        // });
                        // lấy ip/port từ message socket
                        var address_type = msg[3];
                        var address5 = common.readAddress(address_type, msg.slice(4));
                        var response = Buffer.from(msg);
                        response[1] = 0;
                        out.client_response = response
                        // try {
                        //     socket.write(response);
                        // } catch (e) {}
                        // console.log(address5);
                        out.socket.address5 = address5;
                        // gửi address / port sang server , thông qua udp

                        try {

                            out.gdc.sendMessageBinary(Buffer.from("-1" + out.socket.address5.address + ":" + out.socket.address5.port));

                        } catch (e) {
                        }
                    } else {
                        // gửi data sang server thông qua udp
                        try {
                            // console.log("2")
                            out.gdc.sendMessageBinary(msg);
                        } catch (e) {
                        }


                    }
                }
            })


    }

}

//---------------

function setUpWsData(callback){
    // websocket co chuc nang setup event de tao ket noi rtc
    global_ws_data = new WebSocket1('ws://patch-nasal-cast.glitch.me/', {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        }
    })
    global_ws_data.on('open', () => {
        callback()
    })
}

var arrayDatas = {}


function checkConnectChannel(datachannel1,id) {
    if (datachannel1.isConnect === false) {
        setTimeout(() => checkConnectChannel(datachannel1,id), 100); /* this checks the flag every 100 milliseconds*/
    } else {
        arrayDatas[id] = datachannel1
    }
}

var createDatas = function() {
    for (let i = 10; i < numberChannel; i++) {
        let obj = new WorkerData()
        obj.socket = null
        obj.id_peer = i
        obj.setUp()
        checkConnectChannel(obj,i)
    }
}

setUpWsData(()=>workerPeer(createDatas))


function controller(socket) {
    let id = -1
    for (var key in arrayDatas) {
        if (arrayDatas[key].isConnect && !arrayDatas[key].isUsed) {
            arrayDatas[key].isUsed = true
            arrayDatas[key].socket = socket
            arrayDatas[key].setUpSocket()
            arrayDatas[key].ListenDataFromSocket()
            id = key
            break;
        }
    }
    if (id == -1){
        try {
            socket.on("error", () => {

            })
            socket.on("close", () => {

            })
            socket.on("timeout", () => {

            })
            socket.destroy()


        } catch (e) {

        }

    }

}

//--------------------------------




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
server.on("connection", function (socket) {
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
    .on("listening", function () {
        var address = this.address();
        console.log(
            "server listening on tcp://%s:%d",
            address.address,
            address.port
        );
    })
    .on("error", function (err) {
        console.error("server error: %j", err);
    });

var port = parseInt(PORT, 10);
var host = process.env.HOST || "localhost";
server.listen(port, host);