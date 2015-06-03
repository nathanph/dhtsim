/**
 * Created by nate on 5/28/15.
 */

var KBucket = require('k-bucket');

/**
 * Client implementation.
 *
 * @namespace
 */
var Client = {
    // The session generated after connecting.
    session : null,

    // The size and number of Kademlia buckets.
    kSize: 4,

    // A SHA-1 hash representing the client in the network.
    hash: null,

    // The k-bucket to be used to hold peer information.
    kBucket : null,

    // The files this client is tracking.
    files : [],

    // Bins for building the radial graph.
    visBins : null
};
$( document ).ready(function() {
    // Initialize an array of files that you're tracking.
//     var files = [
//         {
//             "name" : "File 1",
//             "hash" : "b68d386047afd22136cb1e7b4d9a961c446f73f2",
//             "trackers" : [
//                 {
//                     "hash" : "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
//                     "sessionID" : "1"
//                 },
//                 {
//                     "hash": "c3499c2729730a7f807efb8676a92dcb6f8a3f8f",
//                     "sessionid" : "2"
//                 }
//             ]
//         },
//         {
//             "name" : "File 2",
//             "hash" : "efa0f7ef05346073b4848f9836f623acc8594155",
//             "trackers" : [
//                 {
//                     "hash": "77de68daecd823babbb58edb1c8e14d7106e83bb",
//                     "sessionid" : "3"
//                 },
//                 {
//                     "hash": "1b6453892473a467d07372d45eb05abc2031647a",
//                     "sessionid" : "4"
//                 }
//             ]
//         }
//     ]

    function renderPeerTable() {
        var peers = JSON.stringify(Client.kBucket.toArray());
        Client.session.topics.update('client/' + Client.hash + '/peers', peers);
        var peers = Client.kBucket.toArray();
        console.log(peers);
        $('#peer-list tbody').empty();
        var tableRows = "";
        peers.forEach(function(peer, index) {
            tableRows +=
                '<tr>' +
                '<td>' + index + '</td>' +
                '<td>' + peer.id.toString('base64') + '</td>' +
                '<td>' + KBucket.distance(Client.hash, peer.id.toString('base64'))  + '</td>' +
                '</tr>';
        });
        $('#peer-list tbody').append(tableRows);
    }

    function addPeer(hash) {
        if(hash === Client.hash) {
            return;
        }
        var preSize = Client.kBucket.count();
        Client.kBucket.add({id:hash});
        var postSize = Client.kBucket.count();
        if(preSize != postSize) {
            console.log("Peer added: " + hash);
            renderPeerTable();
        } else {
                console.log("Peer not added (bucket full): " + hash);
            }
        }

    /**
     * Initializes subscriptions to the topics relevant to this client session (announce, put, and lookup).
     */
    function initSubscriptions(session) {
        // Listen for announcements from clients (a new peer).
        session.subscribe('client/' + Client.hash + '/announce').on('update', function (data) {
            $('#announce').append('<br>' + data);
            addPeer(data);
        });

        // Listen for put requests (a peer wants you to track a file).
        session.subscribe('client/' + Client.hash + '/put').on('update', function (data) {
            $('#put').append('<br>' + data);
        });

        // Listen for lookup requests (a peer wants to know if you're tracking a file).
        session.subscribe('client/' + Client.hash + '/lookup').on('update', function (data) {
            $('#put').append('<br>' + data);
        });

        session.subscribe('client' + Client.hash + '/peers').on('update', function (data, topic) {
            console.log(data);
        });
    }

    /**
     * Initializes topics for the client session.
     */
    function initTopics(session) {
        // Add topics for this client.
        session.topics.add('client/' + Client.hash + '/id', session.sessionID);
        session.topics.add('client/' + Client.hash + '/announce');
        session.topics.add('client/' + Client.hash + '/peers');
        session.topics.add('client/' + Client.hash + '/files');
        session.topics.add('client/' + Client.hash + '/lookup');
        session.topics.add('client/' + Client.hash + '/put');

        // Remove all topics for client when session disconnects.
        session.topics.removeWithSession('client/' + Client.hash + '/');
    }

    function discoverNodes() {
        var peers = Client.kBucket.toArray();
        peers.forEach(function(peer, index) {
            var subscription = Client.session.subscribe('client/' + peer + '/peers');

            subscription.on('update', function(data, topic) {
                var hash = topic.slice(7,-6);
                console.log(data);
                console.log("Discovering peers of: " + hash);
                data.forEach(function(peer,index) {
                    if(peer !== Client.hash) {
                        addPeer(peer);
                    }
                });
                Client.session.unsubscribe(topic);
            });
            Client.session.topics.update('client/' + Client.hash + '/peers', 1);
        });
    }

    $('#discover-nodes').click(discoverNodes);

    /**
     * Use the server to bootstrap into the network. The server will provide a few active peers.
     */
    function bootstrap(session) {
        // session.topics.remove('?client//'); // Remove this later, it's just for cleaning up topics.

        var promise = new Promise(function(resolve, reject) {
            // Let's cheat for now and use a wildcard within the topic.
            var subscription = session.subscribe('?client/.*');
            var bootstrapPeers = [];

            // Add the client to our peer list.
            subscription.on('subscribe', function (data, topic) {
                hash = topic.substring(7);

                if(hash !== Client.hash) {
                    bootstrapPeers.push(hash);
                }

                if (bootstrapPeers.length == 3) {
                    session.unsubscribe('?client/.*');
                    resolve(bootstrapPeers);
                }
            });
        });

        promise.then(function(peers) {
            peers.forEach(function(peer) {
                console.log(peer);
                addPeer(peer);
                $('#bootstrap .panel-body').append(peer + "<br>" );
            });
            $('#bootstrap').toggleClass("panel-default panel-success");
            $('#discover-nodes').toggleClass("btn-default btn-primary disabled");
//            buildVisBins();
            findClients();
        });
    }

    function findClients() {
        // Let's cheat for now and use a wildcard within the topic.
        var subscription = Client.session.subscribe('?client/.*');

        // Add the client to our peer list.
        subscription.on('subscribe', function (data, topic) {
            console.log("Sub");
            hash = topic.substring(7);

            var doesMatch = false;
            Client.kBucket.toArray().forEach( function(peer, index) {
                if(hash === peer) {
                    doesMatch = true;
                }
            });

            if(hash !== Client.hash) {
                if(!doesMatch) {
                    addPeer(hash);
                }
            }
        });
    }

    /**
     * Initialize everything after we've connected to the Reappt server.
     */
    function connectionSuccess(session) {
        Client.session = session;
        Client.hash = Sha1.hash(session.sessionID);
        Client.kBucket = new KBucket({
            numberOfNodesPerKBucket : Client.kSize,
            localNodeId : Client.hash
        });

        $('#session-id').append(" " + session.sessionID);
        $('#client-hash').append(" " + Client.hash);

        // Init all the things.
        initVisBins();
        initTopics(session);
        bootstrap(session);
        initSubscriptions(session);
    }

    /**
     * Connect to the Reappt server.
     */
    diffusion.connect({
        host: 'disloyalAristotle.eu.reappt.io',
        principal: '',
        credentials: '',
        port: '443'
    }).then(connectionSuccess, function() {alert("Failed to connect.");});

    function initVisBins() {
        Client.visBins = [];
        while(Client.visBins.push([]) < 360);
    }

    function determineVisBin(hash) {
        hash = parseInt(hash, 64);
        console.log("atob hash: " + hash);
        var range = Math.pow(2,160)/360;
        for(i=0; i<360; i++) {
            if(hash>=range*i && hash<range*i+1) {
                return i;
            }
        }
    }

    function buildVisBins() {
//         var peers = Client.kBucket.toArray();
//         var clientBin = determineVisBin(Client.hash);
//         console.log("Client hash: " + Client.hash);
//         console.log("Client bin: " + clientBin);
//         peers.forEach(function(hash, index) {
//             var bin = determineVisBin(hash);
//             console.log(clientBin);
//             Client.visBins[clientBin].push(bin);
//         });
    }

    function buildJSON() {

    }

});
