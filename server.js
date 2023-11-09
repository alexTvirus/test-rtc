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
        axios.get(`http://localhost:8000/id=${msg.id}`)
    }
});