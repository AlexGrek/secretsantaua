const WebSocket = require('ws');
let random = new (require('random-utils-and-tools').Random)()

const wss = new WebSocket.Server({ port: 3030 });

console.log("Server launched")

var random1name = [
  "Здоровий", "Величезний", "Проблемний", "Нікчемний", "Волохатий", "Пихатий", "Розумний", "Смердючий",
  "Огидний", "Мертвий всередині", "Не найкращий", "Солодкий", "Хтивий", "Веганський", "ФОП", "Старий", "Незграбний",
  "Невдалий", "Відвертий", "Феміністичний", "Дірявий", "Бандерівський", "Пишногрудий", "Сексуальний",
  "Іранський", "Державний", "Просто", "Сивочолий", "Голий", "Деякий", "Сраний", "Збочений", "Цнотливий", "Незайманий",
  "Одружений", "Штопаний", "Дикий", "Вусатий", "Бухий", "Відомий", "Солоний"
]

var random2name = [
  "час", "огірок", "прутень", "півень", "пес", "німець", "код", "цюцюндрик", "сосок", "наркоман", "президент",
  "гетьман", "телепень", "бовдур", "дідько", "блогер", "тіктокер", "король", "князь", "збочинець", "мазохіст",
  "торгаш", "розробник", "жах", "ніндзя", "призовник", "поліцейський", "депутат", "алкоголік", "наїздник бутилок",
  "кишківник", "Порошенко", "стержень", "організм", "страус", "поні"
]

function takeRandomFromPool(items) {
  var item = items[Math.floor(Math.random() * items.length)];
  return item;
}

function randomName() {
  var first = takeRandomFromPool(random1name);
  var second = takeRandomFromPool(random2name);
  return `${first} ${second}`
}

var realNamesMapping = {}
var wishesMapping = {}
var giftMapping = {}
var usersClientsPool = {}
var state = {
  registered: [],
  ready: [],
  pairs: [],
  options: {
    "shuffle_alg": "random",
    "reveal_names": true
  }
}

function p(f, t) {
  console.log(`PAIR: ${f}  --->  ${t}`)
  return { f: f, t: t }
}

function distribute(usersAll) {
  console.log("Shuffling everything...");
  var users = [...usersAll]
  random.shuffle(users);
  var usersPool = [...usersAll] // unshuffeled
  var pairs = []
  var failure = false
  users.forEach((el) => {
    var available = [...usersPool]
    if (available.includes(el)) {
      // we don't want to pick only one
      removeItem(available, el);
    }
    if (available.length == 0) {
      console.warn("Failed, restarting...")
      failure = true;
    }
    var chosen = random.choice(available)
    pairs.push(p(el, chosen));
    removeItem(usersPool, chosen);
  })
  if (failure) {
    return distribute(usersAll);
  }
  return pairs;
}

function populateGiftPairs(pairs) {
  pairs.forEach((el) => {
    giftMapping[el.f] = el.t;
  })
}

function sendRevealData(client) {
  console.warn(`sending reveal data: ${giftMapping}`);
  for (const [key, value] of Object.entries(usersClientsPool)) {
    console.log(`Checking ${key}`);
    var client = value;
    if (client.readyState === WebSocket.OPEN && giftMapping[key]) {
      console.log(`Sending reveal data to ${key}`);
      var name = giftMapping[key];
      var realName = state.options.reveal_names ? realNamesMapping[name] : "anonymous_" + random.randomAsciiLetters(4);
      var reveal = { id: name, wishes: wishesMapping[name], realName: realName };
      console.log(reveal);
      var value_to_send = JSON.stringify({ personal: { reveal: reveal } })
      client.send(value_to_send);
    }
  }
}

function updateState(input, client, name) {
  console.log("Received command: " + input.command);
  if (input.command == "register") {
    var realName = input.realName;
    var user = name;
    state.registered.push(user);
    console.log(`I want to assing user <${user}> to have real name <${realName}>`)
    realNamesMapping[user] = realName;
    client.send(JSON.stringify({ personal: { assignedName: user, realName: realName } }));
  }
  if (input.command == "changeopt") {
    var name = input.option
    var value = input.value
    state.options[name] = value
  }
  if (input.command == "ready") {
    var wishes = input.wishes;
    user = name;
    state.ready.push(user);
    console.log(`I want to assing user <${user}> to have wishes: <${wishes}>`)
    wishesMapping[user] = wishes;
    if (state.registered.every(el => state.ready.includes(el)) && state.registered.length > 2) {
      state.pairs = distribute(state.registered);
      populateGiftPairs(state.pairs);
    }
  }
}

function sendChat(wss, ws, data) {
  wss.clients.forEach(function each(client) {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function reset() {
  realNamesMapping = {}
  wishesMapping = {}
  giftMapping = {}
  usersPool = {}
  state = {
    registered: [],
    ready: [],
    pairs: [],
    options: {
      "shuffle_alg": "random",
      "reveal_names": true
    }
  }
}

function sendUpdates(wss, state) {
  console.warn(state);
  var value_to_send = JSON.stringify({ update: state })
  console.log("Send state updates: " + value_to_send)
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(value_to_send);
    }
  });
}

function removeItem(list, item) {
  var index = list.indexOf(item);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    console.warn(`removeItem: ${item} not present in ${list}`);
  }
  return list;
}

wss.on('connection', function connection(ws) {
  var name = randomName();
  usersClientsPool[name] = ws;
  ws.on('message', function incoming(data) {
    console.log(data);
    var parsed = JSON.parse(data);
    if (parsed.command !== undefined) {
      console.log("Updating state");
      updateState(parsed, ws, name);
      sendUpdates(wss, state);
      if (state.pairs.length > 0) {
        sendRevealData(wss);
      }
    }
    else {
      sendChat(wss, ws, data);
    }
  });
  ws.on('close', (reason, descr) => {
    var removedUser = name;
    console.log("Removed user " + removedUser);
    console.log(state);
    if (state.registered.indexOf(removedUser) >= 0) {
      removeItem(state.registered, removedUser);
      console.log("removed from registered: " + removedUser)
    }
    delete usersClientsPool[removedUser];
    console.log(state);
    if (state.registered.length < 1) {
      // everyone left
      reset();
    }
    sendUpdates(wss, state);
  });
});
