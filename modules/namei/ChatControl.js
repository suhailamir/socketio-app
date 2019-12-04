class ChatControl{
    constructor(io, db, sequelize){
        this.io = io;
        this.db = db;
        this.sequelize = sequelize;
    }

    /**
     * Adds an user to the online list
     * @param {String} uuid      uuid
     * @param {String} type     type
     */
    async init_user(users, uuid, type){
        if(type == "applicant"){
            /** Get the applicant and all its chats */
            let applicant = await this.getApplicantData(uuid);
            let chats = await this.find_all_chats(applicant.uuid);

            let receivers = [];
            /** Push every other respondent in the receivers array */
            for(let c = 0; c < chats.length; c++)
                receivers.push(chats[c].user1Id == uuid ? chats[c].user2Id : chats[c].user1Id)

            if(applicant)
                (await this.load_chat(users, applicant.uuid, receivers)).send();
        } else

        if(type == "company"){
            /** Get the company and all its chats */
            let company = await this.getCompanyData(uuid);
            let chats = await this.find_all_chats(company.uuid);

            let receivers = [];
            /** Push every other respondent in the receivers array */
            for(let c = 0; c < chats.length; c++)
                receivers.push(chats[c].user1Id == uuid ? chats[c].user2Id : chats[c].user1Id)

            if(company)
                (await this.load_chat(users, company.uuid, receivers)).send();
        }
    }

    /**
     * Tries to find a chat and if it failes, makes one
     * @param {String} sender   uuid of sender
     * @param {String} receiver uuid of receiver
     * @param {Array} users     When given, it will send a messages to the receiver
     */
    async find_or_build_chat(sender, receiver, users = false){
        var _this = this;

        return new Promise(resolve => {
            /** Find the chat */
            this.db.chats.findOne({ where: {
                [this.sequelize.Op.or]:[
                    {user1Id: sender, user2Id: receiver},
                    {user1Id: receiver, user2Id: sender}
                ]
            }})
            .then(async function(chat){
                /** if the chat does not exist, make a new one */
                if(!chat){
                    /** first check if the users exists */
                    let user_receiver = await _this.getCompanyData(receiver);
                    /** if the user exists, create a table and resolve the promise. */
                    if(user_receiver){
                        _this.db.chats.build({
                            chatId:     sender + "-" + receiver,
                            user1Id:    sender,
                            user2Id:    receiver
                        }).save()
                        .then(async function(){
                            /** If the users array is given, send. */
                            if(user != false){
                                console.log("Chat not found!")

                                /** Since the chat didn't exist, we should first send some data to the one asking for it */
                                (await _this.load_chat(users, receiver, [sender])).send();
                            }

                            resolve(chat);
                        })
                        .catch(error => {
                            /** did not make chat, return false */
                            console.log("Error in ChatControl.js at function find_or_build_chat: " + error);
                        });
                    }
                } else
                    resolve(chat);
            })
        })
    }

    /**
     * Loads a chat
     * @param {Array} users         users
     * @param {String} sender       uuid of loader
     * @param {Array} receivers     Array of uuids
     */
    async load_chat(users, sender, receivers){
        console.log(users);
        var _this = this;
        var storage = {
            /** store all messages temporarily */
            sender:sender,
            users:users,
            messages: [],
            /** sends to the one in need for the chats */
            send: () => {
                users[this.indexOfUser(users, sender)].socket.emit("chat_init", {
                    messages: storage.messages,
                    id:users[this.indexOfUser(users, sender)].id
                });
            }
        }

        for(let c = 0; c < receivers.length; c++){
            let receiver = receivers[c];

            // Find the data of the chat
            let chat = await this.find_or_build_chat(sender, receiver);

            // Get all the messages
            let job = new Promise(resolve => {
                this.db.messages.findAll({ where: {chatId: chat.chatId}})
                .then(async function(messages){
                    // If there are no messages
                    if(messages.length == 0){
                        let company = await _this.getCompanyData(receiver);

                        /** resolve an object of the user chat if the company does exist*/
                        if(company)
                            resolve({
                                uuid:receiver,
                                name:company.name,
                                messages:"",
                                missed:0,
                                rating:""
                            });
                    } else {
                        let name = "", target = (await _this.getApplicantData(receiver));

                        /** if target == null, the receiver uuid must be in the company database */
                        if(!target){
                            /** if the user was deleted, the target wil be null */
                            target = (await _this.getCompanyData(receiver))

                            if(target)
                                name = target.name;
                        } else
                            name = target.first_name + " " + target.surname;

                        let message = [];
                        for (let m = 0; m < messages.length; m++)
                            message.push([messages[m].message, messages[m].senderId, messages[m].date]);

                        /** resolve an object of the user chat */
                        resolve({
                            uuid:receiver,
                            name:name,
                            messages:message,
                            missed: 0,
                            rating:chat.rating
                        });
                    }
                });
            });

            storage.messages.push(await job);
        }

        return storage;
    }

    /**
     * Deletes a chat
     * @param {*} sender    sender
     * @param {*} receiver  receiver
     */
    async delete_chat(sender, receiver){
        /** remove the user from the chat */
        this.db.chats.findOne({ where: this.find_or_build_chat(sender, receiver) })
        .then(function (chat){
            console.log(chat)
            if(chat)
                chat.removeUser(sender);
        });

        /** check if the one wanting to delete is an applicant */
        let applicant = await this.getApplicantData(sender);
        console.log(applicant)
        /** It is not an applicant but a company, so delete that */
        if(!applicant)
            (await this.getCompanyData(sender)).updateChatList(receiver, true);
        else
            applicant.updateChatList(receiver, true);
    }

    /**
     * Sends a private message
     * @param {String} message  message
     * @param {String} sender   sender uuid
     * @param {String} receiver   receiver uuid
     * @param {Time} date       time of sending
     */
    async private_message(users, message, sender, receiver, date){
        var _this = this;

        /** find in the database */
        // check any of the 4 possibilities if the chat already existed
        let chat = await this.find_or_build_chat(sender, receiver, users);

        // The sender will create a chat if not present, so stimulate the receiver to do so as well.
        if(!chat.has_then_add_user(receiver)){
            console.log("User not found!")
            // retry sending the message
            await _this.private_message(users, message, sender, receiver, date);
            return;
        }

        // nothing stopped us, so we can send the message
        let u = _this.indexOfUser(users, receiver);

        // send message
        if(u !== -1)
            users[u].socket.emit("private_message", {message:message, sender:sender, date:date});

        // add to database
        _this.newMessage(chat.chatId, sender, date, message);
        // chat.updateRead(chat.users.indexOf(receiver), true);
    }

    /**
     * updates the missed_messages counter
     * @param {String} sender the one which missed_messages count should be set to 0
     * @param {*} receiver for finding the table purposes
     */
    /** THIS IS DISABLED DUE TO THE MISSING ENTRY IN THE DATABASE REQUIRED TO STORE TWO VALUES */
    chat_missed_set_zero(sender, receiver){
        /** find in the database */
        this.db.chats.findOne({ where: this.find_or_build_chat(sender, receiver) })
        .then(function (chat){
            if(chat)
                chat.updateRead(chat.users.indexOf(sender), false);
        });
    }

    /**
     * Gets applicant data by their uuid
     * @param {String} uuid
     */
    async getApplicantData(uuid){
        return new Promise(resolve => {
            this.db.applicants.findOne({ where : { uuid: uuid }})
            .then(function(user){
                resolve(user);
            });
        }).catch(function(err){
            console.log("Error in ChatControl.js at function getApplicantData: "+ err)
        });
    }

    newMessage(chatId, sender, date, message){
        this.db.messages.build({
            chatId:     chatId,
            senderId:   sender,
            date:       date,
            message:    message
        }).save();
    }

    /**
     * Gets company data by their uuid
     * @param {String} uuid
     */
    async getCompanyData(uuid){
        return new Promise(resolve => {
            this.db.companies.findOne({ where : { uuid: uuid }})
            .then(function(user){
                resolve(user);
            });
        }).catch(function(err){
            console.log("Error in ChatControl.js at function getCompanyData: "+ err)
        });
    }

    /**
     * Finds an user in the this.users object and returns its key
     * @param {String} identifier uuid or id of the one to be found
     * @returns {Int} index of user. -1 means not online
     */
    indexOfUser(users, identifier){
        for(var u = 0; u < users.length; u++)
            if(users[u].uuid == identifier || users[u].id == identifier)
                return u;

        // user not online
        return -1;
    }

    async find_all_chats(sender){
        return new Promise(resolve => {
            this.db.chats.findAll({ where: {
                [this.sequelize.Op.or]:[
                    {user1Id: sender},
                    {user2Id: sender}
                ]
            }})
            .then(function(chats){
                resolve(chats);
            })
        })
    }
}

module.exports = ChatControl;