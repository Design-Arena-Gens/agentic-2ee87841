const chatLog = document.getElementById('messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const clearBtn = document.getElementById('clear-btn');
const template = document.getElementById('message-template');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const personality = {
  greetings: [
    "Hey there! What's on your mind today?",
    'Hi! Ready when you are — what can I help with?',
    'Hello! Ask me anything or let me know what you’re working on.'
  ],
  fallbacks: [
    "I'm not sure I understand that yet, but we can figure it out together.",
    "That's new to me, but let's break it down and tackle it step by step.",
    "I don't have that information, yet I can help brainstorm a strategy around it."
  ],
  topics: [
    {
      label: 'planning',
      terms: ['plan', 'roadmap', 'schedule', 'timeline', 'strateg'],
      replies: [
        'A quick plan: clarify your objective, list the milestones, then break them into actionable next steps.',
        'Let’s map it out: vision → milestones → weekly focus → daily tasks. Want to fill it in together?',
        'Start with the outcome you want, then work backward to the next thing that moves you there.'
      ]
    },
    {
      label: 'ideas',
      terms: ['idea', 'brainstorm', 'creative', 'concept'],
      replies: [
        'Try a “three angles” brainstorm: obvious, risky, and wildcard. Which sounds fun to explore?',
        'Let’s riff! Describe your constraints and goal, and I’ll pitch variations.',
        'Think of three audiences, then tailor the idea to each — you’ll discover fresh directions fast.'
      ]
    },
    {
      label: 'motivation',
      terms: ['stuck', 'motivation', 'energy', 'burnout', 'tired'],
      replies: [
        'Momentum hack: name one tiny task you can finish in under 5 minutes and celebrate it.',
        'Energy check: hydrate, two deep breaths, and reset your intention — small rituals raise focus.',
        'Try “time boxing” 20 minutes with a single goal. Short bursts make big tasks feel doable.'
      ]
    },
    {
      label: 'tech',
      terms: ['code', 'bug', 'debug', 'api', 'database', 'deploy'],
      replies: [
        'Start by restating the problem: what did you expect, what happened, and what changed recently?',
        'Log the inputs/outputs to isolate the breaking point — debugging is detective work with data.',
        'Version control saves the day: checkpoint your state, experiment freely, and roll back if needed.'
      ]
    }
  ]
};

const history = [];

function createMessage({ author, text, time, variant }) {
  const node = template.content.firstElementChild.cloneNode(true);
  const avatar = node.querySelector('.message__avatar');
  const authorNode = node.querySelector('.message__author');
  const timeNode = node.querySelector('.message__time');
  const textNode = node.querySelector('.message__text');

  authorNode.textContent = author;
  timeNode.textContent = time;
  textNode.textContent = text;

  if (variant === 'bot') {
    node.classList.add('message--bot');
    avatar.textContent = '🤖';
  } else {
    node.classList.add('message--user');
    avatar.textContent = '🧑';
  }

  return node;
}

function appendMessage(message) {
  const node = createMessage(message);
  chatLog.appendChild(node);
  chatLog.scrollTo({
    top: chatLog.scrollHeight,
    behavior: 'smooth'
  });
}

function formatTime(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function scoreTopic(text) {
  const normalized = normalize(text);
  return personality.topics
    .map((topic) => {
      const hits = topic.terms.reduce(
        (count, term) => count + (normalized.includes(term) ? 1 : 0),
        0
      );
      return { topic, hits };
    })
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => b.hits - a.hits);
}

function craftReply(input) {
  const normalized = normalize(input);
  if (/^(hi|hello|hey|yo|sup)\b/.test(normalized)) {
    return personality.greetings[Math.floor(Math.random() * personality.greetings.length)];
  }

  const matches = scoreTopic(normalized);
  if (matches.length) {
    const [best] = matches;
    return best.topic.replies[Math.floor(Math.random() * best.topic.replies.length)];
  }

  if (history.length) {
    const last = history[history.length - 1];
    if (last.variant === 'bot') {
      return "Let's build on that — what part should we tackle first?";
    }
  }

  return personality.fallbacks[Math.floor(Math.random() * personality.fallbacks.length)];
}

async function handleUserMessage(message) {
  const time = formatTime();
  const userEntry = { author: 'You', text: message, time, variant: 'user' };
  history.push(userEntry);
  appendMessage(userEntry);

  const typingEntry = createMessage({
    author: 'Bot',
    text: 'typing...',
    time: formatTime(),
    variant: 'bot'
  });

  typingEntry.classList.add('message--ghost');
  typingEntry.querySelector('.message__avatar').textContent = '💭';
  chatLog.appendChild(typingEntry);
  chatLog.scrollTo({ top: chatLog.scrollHeight, behavior: 'smooth' });

  const lag = Math.min(2000, 600 + message.length * 20);
  await wait(lag);

  typingEntry.remove();

  const reply = craftReply(message);
  const botEntry = {
    author: 'Bot',
    text: reply,
    time: formatTime(),
    variant: 'bot'
  };
  history.push(botEntry);
  appendMessage(botEntry);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  handleUserMessage(message).catch((error) => {
    console.error(error);
    appendMessage({
      author: 'Bot',
      text: 'Something went wrong, but I am back now.',
      time: formatTime(),
      variant: 'bot'
    });
  });
});

chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  const max = 200;
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, max)}px`;
});

clearBtn.addEventListener('click', () => {
  while (chatLog.children.length > 1) {
    chatLog.removeChild(chatLog.lastElementChild);
  }
  history.length = 0;
  chatInput.value = '';
  chatInput.style.height = 'auto';
  appendMessage({
    author: 'Bot',
    text: "All cleared! What's next on your mind?",
    time: formatTime(),
    variant: 'bot'
  });
});

appendMessage({
  author: 'Bot',
  text: 'Tip: add context (goal, constraints, vibe) to get richer replies.',
  time: formatTime(),
  variant: 'bot'
});
