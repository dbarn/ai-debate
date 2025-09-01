let providers = [];
let currentTurn = 0;
let history = [];
let engines = {};

function markdownToHtml(markdown) {
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

const engineASelect = document.getElementById('engineA');
const engineBSelect = document.getElementById('engineB');
const topicTextarea = document.getElementById('topic');
const extraPromptTextarea = document.getElementById('extraPrompt');
const startBtn = document.getElementById('startBtn');
const proceedBtn = document.getElementById('proceedBtn');
const customPromptBtn = document.getElementById('customPromptBtn');
const customPromptModal = document.getElementById('customPromptModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const customPromptTextarea = document.getElementById('customPromptTextarea');
const prefillLastResponseBtn = document.getElementById('prefillLastResponseBtn');
const modalProceedBtn = document.getElementById('modalProceedBtn');
const chatEl = document.getElementById('chat');
const spinner = document.getElementById('loadingSpinner');

function scrollToBottom() {
  // Use requestAnimationFrame to ensure DOM has updated
  requestAnimationFrame(() => {
    chatEl.scrollTop = chatEl.scrollHeight;
    // Double check with a small delay
    setTimeout(() => {
      chatEl.scrollTop = chatEl.scrollHeight;
    }, 10);
  });
}

function renderHistory() {
  // Clear chat but keep the spinner
  const spinnerEl = chatEl.querySelector('#loadingSpinner');
  chatEl.innerHTML = '';
  
  history.forEach((m, idx) => {
    const tpl = document.getElementById('msgTpl');
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.classList.add(idx % 2 === 0 ? '--left' : '--right');
    node.querySelector('.msg__author').textContent = m.speaker;
    node.querySelector('.msg__bubble').innerHTML = markdownToHtml(m.text);
    chatEl.appendChild(node);
  });
  
  // Add spinner back after all messages
  if (spinnerEl) {
    chatEl.appendChild(spinnerEl);
  }
  
  scrollToBottom();
}

async function loadProviders() {
  const res = await fetch('/api/providers');
  const data = await res.json();
  providers = data.providers;
  providers.forEach(opt => {
    [engineASelect, engineBSelect].forEach(sel => {
      const o = document.createElement('option');
      o.value = opt.key; o.textContent = opt.label; sel.appendChild(o);
    });
  });
  if (engineASelect.options.length) engineASelect.selectedIndex = 0;
  if (engineBSelect.options.length > 1) engineBSelect.selectedIndex = 1;
}

async function step() {
  const engine = currentTurn % 2 === 0 ? engines.a : engines.b;
  spinner.classList.remove('hidden');
  
  // Scroll to bottom when spinner shows
  scrollToBottom();
  
  const res = await fetch('/api/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      engine,
      topic: topicTextarea.value,
      history,
      extraPrompt: extraPromptTextarea.value
    })
  });
  const data = await res.json();
  spinner.classList.add('hidden');
  if (!res.ok) throw new Error(data.error);
  history.push({ speaker: data.speaker, text: data.text });
  renderHistory();
  currentTurn++;
}

function getLastAIResponse() {
  return history.length > 0 ? history[history.length - 1].text : '';
}

function openCustomPromptModal() {
  if (customPromptModal) {
    customPromptModal.classList.remove('hidden');
    if (customPromptTextarea) {
      customPromptTextarea.focus();
    }
  }
}

function closeCustomPromptModal() {
  if (customPromptModal) {
    customPromptModal.classList.add('hidden');
  }
  if (customPromptTextarea) {
    customPromptTextarea.value = '';
  }
}

async function proceedWithCustomPrompt() {
  if (!customPromptTextarea) {
    alert('Custom prompt textarea not found');
    return;
  }

  const customPrompt = customPromptTextarea.value.trim();
  if (!customPrompt) {
    alert('Please enter a custom prompt');
    return;
  }

  // Add the custom prompt as a user message to history
  history.push({ speaker: 'User', text: customPrompt });
  renderHistory();
  currentTurn++;

  // Close modal
  closeCustomPromptModal();

  // Proceed with the next AI step
  try {
    if (modalProceedBtn) modalProceedBtn.disabled = true;
    if (customPromptBtn) customPromptBtn.disabled = true;
    if (proceedBtn) proceedBtn.disabled = true;
    await step();
  } catch (e) {
    alert(e.message);
  } finally {
    if (modalProceedBtn) modalProceedBtn.disabled = false;
    if (customPromptBtn) customPromptBtn.disabled = false;
    if (proceedBtn) proceedBtn.disabled = false;
  }
}

function initDebate() {
  history = [];
  currentTurn = 0;
  engines = { a: engineASelect.value, b: engineBSelect.value };
  // Clear chat but keep the spinner
  const spinnerEl = chatEl.querySelector('#loadingSpinner');
  chatEl.innerHTML = '';
  if (spinnerEl) {
    chatEl.appendChild(spinnerEl);
  }
  proceedBtn.disabled = false;
  customPromptBtn.disabled = false;
}

startBtn.addEventListener('click', async () => {
  initDebate();
  try {
    proceedBtn.disabled = true;
    await step(); // trigger first AI message immediately
  } catch (e) {
    alert(e.message);
  } finally {
    proceedBtn.disabled = false;
  }
});

proceedBtn.addEventListener('click', async () => {
  try {
    proceedBtn.disabled = true;
    customPromptBtn.disabled = true;
    await step();
  } catch (e) {
    alert(e.message);
  } finally {
    proceedBtn.disabled = false;
    customPromptBtn.disabled = false;
  }
});

// Custom prompt modal event listeners
if (customPromptBtn) {
  customPromptBtn.addEventListener('click', openCustomPromptModal);
}

if (modalCloseBtn) {
  modalCloseBtn.addEventListener('click', closeCustomPromptModal);
}

if (prefillLastResponseBtn) {
  prefillLastResponseBtn.addEventListener('click', () => {
    const lastResponse = getLastAIResponse();
    if (customPromptTextarea) {
      customPromptTextarea.value = lastResponse;
    }
  });
}

if (modalProceedBtn) {
  modalProceedBtn.addEventListener('click', proceedWithCustomPrompt);
}

// Close modal when clicking outside of modal content
if (customPromptModal) {
  customPromptModal.addEventListener('click', (e) => {
    if (e.target === customPromptModal) {
      closeCustomPromptModal();
    }
  });
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && customPromptModal && !customPromptModal.classList.contains('hidden')) {
    closeCustomPromptModal();
  }
});

// Initialize modal state
function initializeModal() {
  if (customPromptModal) {
    customPromptModal.classList.add('hidden');
  }
}

// Voice recognition functionality
let recognition;
let isListening = false;

function initVoiceRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language;
    
    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      const targetId = recognition.targetId;
      const textarea = document.getElementById(targetId);
      if (textarea) {
        let str = transcript;
        let modStr = str[0].toUpperCase() + str.slice(1);
        textarea.value = modStr;
      }
      stopListening();
    };
    
    recognition.onerror = function(event) {
      console.error('Speech recognition error:', event.error);
      stopListening();
    };
    
    recognition.onend = function() {
      stopListening();
    };
  }
}

function startListening(targetId) {
  if (!recognition) {
    alert('Voice recognition not supported in this browser');
    return;
  }
  
  if (isListening) {
    stopListening();
    return;
  }
  
  recognition.targetId = targetId;
  recognition.start();
  isListening = true;
  
  // Update button appearance
  const btn = document.querySelector(`[data-target="${targetId}"]`);
  if (btn) {
    btn.textContent = '🔴';
    btn.classList.add('listening');
  }
}

function stopListening() {
  if (recognition && isListening) {
    recognition.stop();
  }
  isListening = false;
  
  // Reset all voice buttons
  document.querySelectorAll('.voice-btn').forEach(btn => {
    btn.textContent = '🎤';
    btn.classList.remove('listening');
  });
}


// Add event listeners for voice buttons
document.addEventListener('DOMContentLoaded', function() {
  initVoiceRecognition();
  
  document.querySelectorAll('.voice-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      startListening(targetId);
    });
  });
});

// Initialize everything
initializeModal();
loadProviders();
