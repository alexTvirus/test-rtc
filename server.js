const nodeDataChannel = require('node-datachannel');
const axios = require('axios');
var net = require("net");
var WebSocket = require('rpc-websockets').Client

const WebSocket1 = require('ws');

const ws = new WebSocket1('ws://patch-nasal-cast.glitch.me/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    }
})


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

const { Worker } = require("worker_threads");

function createWorker(client_id) {
    let id = client_id
    const worker = new Worker("./worker1.js", {
        workerData: { id: id },
    });
}

var socketQueue = new Queue();

var isFirst1 = true

let id, room, caller;
var isConnect = false;
id = randomId(16);
room = id;
var gdc;

ws.on('open', () => {
    //console.log('WebSocket connected, signaling ready');
    ws.send(JSON.stringify({
        method: 'server',
        id: 1
    }));
});

ws.on('message', (msgStr) => {
    let msg = JSON.parse(msgStr);
    console.log(msgStr)
    if (msg.id) {
        //console.log("client_id " + msg.id)
        workerController(msg.id);
    }

    function workerController(client_id) {
        let isFirst = true
        var ws1 = new WebSocket('ws://treasure-woozy-court.glitch.me/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
            }
        })
        ws1.on('open', function() {
            console.log(" open2 ")
            if (isFirst) {
                isFirst = false

                //console.log("id " + id)
                ws1.notify('client-add-complete-server', {
                    "id": id,
                    "client_id": client_id
                })

                ws1.subscribe('client-add-new-client')

                ws1.on('client-add-new-client', function(answer) {
                    if (answer.id == client_id) {
                        ws1.notify("client-add-new-server", {
                            "server_id": id,
                            "client_id": answer.id
                        });
                    }
                })




                // function endCall() {
                //     room = undefined;
                //     try {
                //         caller.close();
                //     } catch (err) {

                //     }
                // }

                // function endCurrentCall() {
                //     ws1.notify('client-endcall', {
                //         "room": room,
                //         "is_server": true
                //     })
                //     endCall();
                // }

                ws1.subscribe('client-candidate')
                ws1.on('client-candidate', function(msg) {
                    if (!isConnect && msg.is_client && msg.room == room) {
                        try {
                            caller.addRemoteCandidate(msg.candidate, msg.mid);
                        } catch (e) {}

                    }
                })

                ws1.subscribe('client-sdp')
                ws1.on('client-sdp', function(msg) {
                    if (!isConnect && msg.is_client && msg.room == id) {
                        room = msg.room;
                        caller = createPeerConnectionOffer(room);
                        caller.setRemoteDescription(msg.description, msg.type);
                    }
                })

                function createPeerConnectionOffer(peerId) {
                    let peerConnection = new nodeDataChannel.PeerConnection('pc', {
                        iceServers: ['stun:stun.l.google.com:19302']
                    });
                    peerConnection.onStateChange((state) => {
                        if (state == 'connected') {
                            console.log(state)
                            isConnect = true;
                            try {
                                ws1.close();
                            } catch (e) {
                                console.log(e);
                            }
                        }

                        //console.log('State: ', state);
                    });
                    peerConnection.onGatheringStateChange((state) => {
                        //console.log('GatheringState: ', state);
                    });
                    peerConnection.onLocalDescription((description, type) => {
                        ws1.notify("server-answer", {
                            "description": description,
                            "room": peerId,
                            "from": id,
                            "is_server": true,
                            type
                        });


                        room = peerId;
                    });
                    peerConnection.onLocalCandidate((candidate, mid) => {
                        ws1.notify("server-candidate", {
                            "candidate": candidate,
                            "room": peerId,
                            "is_server": true,
                            "mid": mid,
                            "type": 'candidate'
                        });

                    });
                    peerConnection.onDataChannel((dc) => {
                        if (!gdc) {
                            gdc = dc;
                            gdc.onMessage((msg) => {
                                // console.log(msg.toString());
                                // if (msg.length == 1) {
                                //     try {
                                //         //console.log('end: ');
                                //         caller.close();
                                //     } catch (err) {
                                //         console.log(err)
                                //     }
                                // }
                                let obj = JSON.parse(msg.toString());
                                axios.get(`http://localhost:8000/id=${obj.id}`)
                                // createWorker(obj.id);
                            });
                        }
                    });
                    return peerConnection;
                }

            }
        })
    }

});