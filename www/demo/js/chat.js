// var socket = io(
//   "/socket.io/socket.io.js",
//   { path: "/socket.io" },
//   { upgrade: false }
// ).connect("", { query: `uuid=${getCookie("uuid")}&type=${getCookie("type")}` });
var socket = io();

//const socket = io('//web.namei.nl', {path: '/demo/chat/socket.io'}).connect('', {query: `uuid=${getCookie('uuid')}&type=${getCookie('type')}` });
const web = {
  sidebar: document.getElementById("online_users"),
  controls: document.getElementById("controls"),
  messages: document.getElementById("messages"),
  input: document.getElementById("input"),
  button: document.getElementById("button")
};

document.getElementsByTagName("main")[0].style.height =
  window.innerHeight -
  document.getElementsByTagName("footer")[0].offsetHeight +
  "px";

/** start config page */
web.input.addEventListener(
  "web.input",
  () => {
    web.input.style.height = "3em";
    web.input.style.height = web.input.scrollHeight + "px";

    web.messages.style.height =
      "calc(100% - " + web.controls.offsetHeight + "px)";
  },
  false
);
web.input.dispatchEvent(new Event("web.input")); // execute the event as init
web.input.focus();

web.sidebar.addEventListener("click", event => {
  for (let u = 0; u < user.chats.length; u++) {
    // if we found the clicked item
    if (
      user.chats[u].uuid + "-info" == event.target.closest("li").id &&
      !user.chats[u].open
    ) {
      user.chats[user.selected].open = false;
      user.chats[u].open = true;
      user.selected = u;

      user.chats[u].load_chat();
      web.input.focus();
      break;
    }
  }
});
web.button.onclick = function(event) {
  event.preventDefault();
  submitMessage();
};
web.input.onkeydown = function(event) {
  if (event.keyCode == 13 && !(event.shiftKey && event.keyCode == 13)) {
    event.preventDefault();
    submitMessage();
  }
};
/** end config page */

// socket
socket.on("chat_init", function(data) {
  console.log("chat_init");
  console.log(data);
  add_user(data.messages);
  user.id = data.id;
});
socket.on("private_message", function(data) {
  add_message_to_chat(data);
});
socket.on("vacancy_matches", function(data) {
  console.log(data);
});

// not used
socket.on("user_disconnect", function(data) {
  remove_user(data);
});
socket.on("joineduser", function(data) {
  add_user(data);
});
socket.on("userlist", function(data) {
  add_user(data);
});

var user = {
  selected: 0,
  /** used to verify user authenticity */
  id: null,
  chats: []
};

class chatUser {
  constructor(uuid, name, messages, missed_messages = 0, rating = 0) {
    this.uuid = uuid;
    this.name = name;
    this.messages = messages == "" ? [] : messages;
    this.last_message = messages == "" ? "" : messages[messages.length - 1][0];
    this.missed_messages = missed_messages == 0 ? "" : missed_messages;
    this.rating = rating;

    this.open = false;
    this.html = this.createHTMLEntity(
      this.uuid,
      typeof this.name == "object"
        ? this.name.first + " " + this.name.surname
        : this.name,
      this.last_message,
      this.missed_messages
    );
    web.sidebar.appendChild(this.html);
  }

  load_chat() {
    while (web.messages.firstChild)
      web.messages.removeChild(web.messages.firstChild);

    for (let c = 0; c < this.messages.length; c++)
      this.add_message(
        this.messages[c][0],
        this.messages[c][1],
        this.messages[c][2],
        false
      );

    this.missed_messages = "";
    socket.emit("chat_read_set_zero", {
      id: user.id,
      sender: getCookie("uuid"),
      receiver: user.chats[user.selected].uuid
    });

    this.update_fast_info();
  }

  /**
   * Adds a message to the messages
   * @param {*} message message
   * @param {*} who you or other
   */
  add_message(message, who, date, store = true) {
    if (store) this.messages.push([message, who, date]);

    let time = new Date(date);
    time = time.getUTCHours() + ":" + time.getUTCMinutes();

    /** Build all elements */
    let container = document.createElement("div");
    container.classList.add(
      "common-content",
      who == this.name ? "you" : "other"
    );

    let c_text = document.createElement("span");
    c_text.classList.add("text");
    c_text.innerHTML = this.last_message = message;

    let c_time = document.createElement("span");
    c_time.classList.add("time");
    c_time.innerHTML = time;

    container.appendChild(c_text);
    container.appendChild(c_time);

    // if we are on the bottom, scroll with the element
    if (this.open)
      if (
        web.messages.scrollHeight - web.messages.scrollTop ===
        web.messages.clientHeight
      ) {
        web.messages.appendChild(container);
        web.messages.scrollTop = web.messages.scrollHeight;
      } else web.messages.appendChild(container);
    else this.missed_messages++;

    this.update_fast_info();
  }

  /**
   * Updates info on the left
   */
  update_fast_info() {
    let li = document.getElementById(this.uuid.trim() + "-info");
    li.getElementsByClassName("last-message")[0].innerHTML = this.last_message;
    li.getElementsByClassName(
      "missed-messages"
    )[0].innerHTML = this.missed_messages;
  }

  /**
   * Creates a Object which can be inserted into the web.sidebar
   * @param {String} uuid
   * @param {String} name
   * @param {String} last_message
   * @param {Int} missed_messages
   */
  createHTMLEntity(uuid, name, last_message, missed_messages) {
    let html = `
        <li id="${uuid.trim()}-info">
            <a href="javascript:void(0)">
                ${name}
            </a>
            <span class="fast-info">
                <span class="last-message">${last_message}</span>
                <span class="missed-messages">${
                  missed_messages == 0 ? "" : missed_messages
                }</span>
            </span>
        </li>
        `;

    return new DOMParser().parseFromString(html, "text/xml").firstChild;
  }

  delete() {
    web.sidebar.removeChild(
      document.getElementById(this.uuid.trim() + "-info")
    );
  }
}

function submitMessage() {
  if (web.input.value !== "") {
    /** create a nice yyyy-mm-dd hh:mm:ss date */
    let date = new Date();
    date =
      date.getUTCFullYear() +
      "-" +
      (date.getUTCMonth() + 1) +
      "-" +
      date.getUTCDate() +
      " " +
      date.getUTCHours() +
      ":" +
      date.getUTCMinutes() +
      ":" +
      date.getUTCSeconds();
    console.log(user);
    socket.emit("private_message", {
      id: user.id,
      sender: getCookie("uuid"),
      receiver: user.chats[user.selected].uuid,
      message: web.input.value,
      date: date
    });

    user.chats[user.selected].add_message(web.input.value, "you", date);
    web.input.value = "";
  }
}

/**
 * This will open a chat, and if not yet deleted, might contain data.
 * @param {String} receiver uuid
 */
function open_new_chat(receiver) {
  console.log(user);
  console.log(getCookie("uuid"));
  socket.emit("open_new_chat", {
    id: user.id,
    sender: getCookie("uuid"),
    receiver: receiver
  });
}

function delete_chat(receiver) {
  socket.emit("delete_chat", {
    id: user.id,
    sender: getCookie("uuid"),
    receiver: receiver
  });

  for (let u = 0; u < user.chats.length; u++) {
    if (user.chats[u].uuid == receiver) {
      user.chats[u].delete();
      user.chats.splice(u, 1);
    }
  }
}

function add_user(array) {
  console.log(array);
  console.log(user.chats, array);
  for (let a = 0; a < array.length; a++) {
    let is_present = false;
    /** check if the user is already loaded in */
    for (let u = 0; u < user.chats.length; u++)
      if (user.chats[u].uuid == array[a].uuid) is_present = true;

    if (!is_present)
      user.chats.push(
        new chatUser(
          array[a].uuid,
          array[a].name,
          array[a].messages,
          array[a].missed,
          array[a].rating
        )
      );
  }
}

function find_vacancies() {
  socket.emit("find_vacancies", {
    id: user.id,
    sender: getCookie("uuid")
  });
}

function setCookie(a, b) {
  document.cookie = a + "=" + b + ";";
}

function getCookie(a) {
  var b = document.cookie.match("(^|[^;]+)\\s*" + a + "\\s*=\\s*([^;]+)");
  return b ? b.pop() : "";
}

function add_message_to_chat(data) {
  for (var u = 0; u < user.chats.length; u++) {
    if (user.chats[u].uuid == data.sender) {
      user.chats[u].add_message(data.message, data.sender, data.date);
      break;
    }
  }
}

/** Will be executed as last, making sure the document is ready */
socket.emit("ready", {
  uuid: getCookie("uuid"),
  type: getCookie("type")
});
