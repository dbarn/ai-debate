let providers = [];
let currentTurn = 0;
let history = [];
let engines = {};

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
    node.querySelector('.msg__bubble').textContent = m.text;
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

// Initialize everything
initializeModal();
loadProviders();
