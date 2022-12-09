var socket = null;

//Prepare game
var app = new Vue({
    el: '#game',
    data: {
        error: null,
        alertMsg: null,
        connected: false,
        messages: [],
        chatmessage: '',
        username: '',
        password: '',
        me: { username: '', state: 0, score: 0 },
        state: 0,
        players: {}
    },
    mounted: function() {
        connect(); 
    },
    methods: {
        handleChat(message) {
            if(this.messages.length + 1 > 10) {
                this.messages.pop();
            }
            this.messages.unshift(message);
        },
        chat() {
            socket.emit('chat',this.chatmessage);
            this.chatmessage = '';
        },
        next() {
            socket.emit('next');
        },
        register() {
            socket.emit('register', {
                username: this.username,
                password: this.password
            })
        },
        login() {
            socket.emit('login', {
                username: this.username,
                password: this.password
            })
        },
        fail(message){
            this.error = message;
            setTimeout(() => this.error=null, 3000);
        },
        alertS(message){
            this.alertMsg = message;
            setTimeout(() => this.alertMsg=null, 3000);
        },
        handleUpdate(data){
            console.log('Data', data)
            this.state = data.gameState;
            this.me = data.me;
            this.players = data.players
        }
    }
});

function connect() {
    //Prepare web socket
    socket = io();

    //Connect
    socket.on('connect', function() {
        //Set connected state to true
        app.connected = true;
    });

    //Handle connection error
    socket.on('connect_error', function(message) {
        // alert('Unable to connect: ' + message);
    });

    //Handle disconnection
    socket.on('disconnect', function() {
        // alert('Disconnected');
        app.connected = false;
    });

    //Handle incoming state update
    socket.on('state', function(data) {
        console.log('State Update?')
        app.handleUpdate(data);
    });

    //Connect
    socket.on('connect', function() {
        //Set connected state to true
        app.connected = true;
    });

    socket.on('fail', function(message){
        app.fail(message);
    })

    socket.on('chat', function(message) {
        app.handleChat(message);
    })

    socket.on('alert', function(message){
        app.alertS(message);
    })
}
