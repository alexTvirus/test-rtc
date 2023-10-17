const nodeDataChannel = require('node-datachannel');
var net = require("net");
var WebSocket = require('rpc-websockets').Client
// instantiate Client and connect to an RPC server
var ws = new WebSocket('ws://treasure-woozy-court.glitch.me/', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    }
})

const { Worker } = require("worker_threads");

function createWorker(client_id) {
    let id = client_id
   const worker = new Worker("./worker1.js", {
      workerData: { id: id },
    });
}

var isFirst1 = true
ws.on('open', function() {
    console.log(" open1 ")
    if (isFirst1) {
        setInterval(() => {
                ws.call('sum', []).then(function(result) {
                    
                })
            },
            30000 // execute the above code every 10ms
        )

        isFirst1 = false
        ws.subscribe('client-add-prepare-client')

        ws.on('client-add-prepare-client', function(answer) {
            console.log("client_id " + answer.id)
            worker(answer.id);
        })
    }
})