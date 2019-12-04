const ChatControl = require("./namei/ChatControl.js")
const Matching = require("./namei/Matching.js")

module.exports = (io, db, sequelize) => {
    var controller = new IOControl(io, db, sequelize);


    io.on('connection', function(socket) {
    console.log(true);
        
//        // this will be called also upon a reload
//        controller.add_user(socket, socket.handshake.query.uuid, socket.handshake.query.type);
//
//        socket.on("disconnect", () => {
//            controller.remove_user(socket.id);
//        });
//
//        socket.on('private_message', (data) => {
//            if(controller.authentic(data.id, data.sender))
//                controller.chatControl.private_message(controller.users, data.message, data.sender, data.receiver, data.date);
//        });
//
//        socket.on('delete_chat', (data) => {
//            if(controller.authentic(data.id, data.sender))
//                controller.chatControl.delete_chat(data.sender, data.receiver);
//        });
//
//        socket.on("open_new_chat", async (data) => {
//            if(controller.authentic(data.id, data.sender))
//                (await controller.chatControl.load_chat(controller.users, data.sender, [data.receiver])).send();
//        });
//
//        /** Disabled because is missing */
//        // socket.on('chat_read_set_zero', (data) => {
//        //     if(controller.authentic(data.id, data.sender))
//        //         controller.chatControl.chat_missed_set_zero(data.sender, data.receiver);
//        // });
//
//        socket.on("find_vacancies", async (data) => {
//            if(controller.authentic(data.id, data.sender))
//                controller.matching.applicant_find_match(controller.users, data.sender)
//        });
    });
}

class IOControl{
    constructor(io, db, sequelize){
        this.chatControl = new ChatControl(io, db, sequelize);
        this.matching = new Matching(io, db, sequelize);

        this.io = io;
        this.db = db;
        this.sequelize = sequelize;

        this.users = [];
    }

    authentic(id, sender){
        for(let u = 0; u < this.users.length; u++)
            if(this.users[u].id == id)
                if(this.users[u].uuid == sender)
                    return true;

        console.log("user is not authentic");
        return false;
    }

    add_user(socket, uuid, type){
        // if the user is not already in the list
        if(this.indexOfUser(uuid) == -1){
            let user = new IOUser(socket, socket.id, uuid, type);
            this.users.push(user);

            console.log("connected: %s, type: %s", uuid, type);
        }

        this.chatControl.init_user(this.users, uuid, type)
    }

    /**
     * Removes an user from the online list
     * @param {String} id generated by io (socket.id)
     */
    remove_user(id){
        let u = this.indexOfUser(id)
        if(u !== -1){
            console.log("disconnected: " + this.users[u].uuid);

            this.io.sockets.emit("user_disconnect", [this.users[u].uuid]);
            this.users.splice(u, 1);
        }
    }

    /**
     * Executed when the browser is ready to receive data
     * @param {*} data
     */
    // init_user(data){
    //     console.log(data)
    //     this.chatControl.init_user(this.users, data.uuid, data.type)
    // }

    /**
     * Finds an user in the this.users object and returns its key
     * @param {String} identifier uuid or id of the one to be found
     * @returns {Int} index of user. -1 means not online
     */
    indexOfUser(identifier){
        for(var u = 0; u < this.users.length; u++)
            if(this.users[u].uuid == identifier || this.users[u].id == identifier)
                return u;

        // user not online
        return -1;
    }
}

class IOUser{
    constructor(socket, id, uuid, type){
        this.socket = socket;
        this.id = id;
        this.uuid = uuid;
        this.type = type;
    }
}