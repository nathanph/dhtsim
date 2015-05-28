/**
 * Created by nate on 5/28/15.
 */

$( document ).ready(function() {
    // Initialize an array of peers in the network.
    var peers = [
        {
            "hash" : "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
            "sessionID" : "1"
        },
        {
            "hash": "c3499c2729730a7f807efb8676a92dcb6f8a3f8f",
            "sessionid" : "2"
        },
        {
            "hash": "77de68daecd823babbb58edb1c8e14d7106e83bb",
            "sessionid" : "3"
        },
        {
            "hash": "1b6453892473a467d07372d45eb05abc2031647a",
            "sessionid" : "4"
        }
    ];

    // Initialize an array of files that you're tracking.
    var files = [
        {
            "name" : "File 1",
            "hash" : "b68d386047afd22136cb1e7b4d9a961c446f73f2",
            "trackers" : [
                {
                    "hash" : "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3",
                    "sessionID" : "1"
                },
                {
                    "hash": "c3499c2729730a7f807efb8676a92dcb6f8a3f8f",
                    "sessionid" : "2"
                }
            ]
        },
        {
            "name" : "File 2",
            "hash" : "efa0f7ef05346073b4848f9836f623acc8594155",
            "trackers" : [
                {
                    "hash": "77de68daecd823babbb58edb1c8e14d7106e83bb",
                    "sessionid" : "3"
                },
                {
                    "hash": "1b6453892473a467d07372d45eb05abc2031647a",
                    "sessionid" : "4"
                }
            ]
        }
    ]

    /**
     * Initializes subscriptions to the topics relevant to this client session (announce, put, and lookup).
     */
    function initSubscriptions(session) {
        // Session hash.
        var sessionHash = Sha1.hash(session.sessionID);

        // Listen for announcements from clients (a new peer).
        session.subscribe('client/' + sessionHash + '/announce').on('update', function (data) {
            $('#announce').append('<br>' + data);
        });

        // Listen for put requests (a peer wants you to track a file).
        session.subscribe('client/' + sessionHash + '/put').on('update', function (data) {
            $('#put').append('<br>' + data);
        });

        // Listen for lookup requests (a peer wants to know if you're tracking a file).
        session.subscribe('client/' + sessionHash + '/lookup').on('update', function (data) {
            $('#put').append('<br>' + data);
        });
    }

    /**
     * Initializes topics for the client session.
     */
    function initTopics(session) {
        // Session hash.
        var sessionHash = Sha1.hash(session.sessionID);

        // Add topics for this client.
        session.topics.add('client/' + sessionHash + '/announce');
        session.topics.add('client/' + sessionHash + '/peers');
        session.topics.add('client/' + sessionHash + '/files');
        session.topics.add('client/' + sessionHash + '/lookup');
        session.topics.add('client/' + sessionHash + '/put');

        // Remove all topics for client when session disconnects.
        session.topics.removeWithSession('client/' + sessionHash + '/');
    }

    /**
     * Use the server to bootstrap into the network. The server will provide a few active peers.
     */
    function bootstrap(session) {
        // TODO:: Bootstrap with server to discover peers.
    }

    /**
     * Initialize everything after we've connected to the Reappt server.
     */
    function initConnection(session) {
        var sessionHash = Sha1.hash(session.sessionID);

        $('#session-id').append(" " + session.sessionID);
        $('#client-hash').append(" " + sessionHash);


        // Init all the things.
        initSubscriptions(session);
        initTopics(session);
        bootstrap(session);
    }

    diffusion.connect({
        host: 'disloyalAristotle.eu.reappt.io',
        principal: '',
        credentials: '',
        port: '443'
    }).then(initConnection, function() {alert("Failed to connect.");});
});

