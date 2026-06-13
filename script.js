const FONTS = {
  playfair: "'Playfair Display', serif",
  dm: "'DM Sans', sans-serif",
  mono: "'Space Mono', monospace",
  cormorant: "'Cormorant Garamond', serif"
};

let notes = JSON.parse(localStorage.getItem('nota_notes') || 'null') || [
  { id: 1, title: "Morning thoughts", body: "There is something magical about the early hours — the city still half asleep, coffee steaming, the whole day ahead like a blank page.", tag: "purple", tagColor: "#7F77DD", tagBg: "#EEEDFE", tagText: "#3C3489", font: "playfair", date: "Jun 3, 2026" },
  { id: 2, title: "Ideas for the project", body: "Color theory matters more than people think. Every palette tells a story. Warm hues feel urgent; cool hues feel eternal.", tag: "teal", tagColor: "#1D9E75", tagBg: "#E1F5EE", tagText: "#085041", font: "dm", date: "Jun 4, 2026" },
  { id: 3, title: "Books to read", body: "1. The Design of Everyday Things\n2. Just My Type\n3. Notes on a Scandal\n4. The Creative Act — Rick Rubin", tag: "blue", tagColor: "#378ADD", tagBg: "#E6F1FB", tagText: "#0C447C", font: "mono", date: "Jun 5, 2026" },
];

let activeId = null, dirty = false, nextId = Math.max(...notes.map(n => n.id), 3) + 1;
let currentTag = { name: "purple", color: "#7F77DD", bg: "#EEEDFE", text: "#3C3489" };

function persist() { localStorage.setItem('nota_notes', JSON.stringify(notes)); }
function fmtDate(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function renderList() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  const list = document.getElementById('notesList');
  const filtered = q ? notes.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) : notes;
  list.innerHTML = '';
  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = q ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'All notes';
  list.appendChild(label);
  if (!filtered.length) {
    const em = document.createElement('div');
    em.style.cssText = 'padding:20px 8px;text-align:center;font-size:12px;color:var(--muted)';
    em.textContent = 'No notes found';
    list.appendChild(em); return;
  }
  filtered.forEach(n => {
    const el = document.createElement('div');
    el.className = 'note-item' + (n.id === activeId ? ' active' : '');
    el.onclick = () => openNote(n.id);
    el.innerHTML = `<div class="note-item-title"><span class="tag-dot" style="background:${n.tagColor}"></span>${n.title || 'Untitled'}</div><div class="note-item-preview">${n.body.slice(0, 55) || 'No content'}</div><div class="note-item-date">${n.date}</div>`;
    list.appendChild(el);
  });
}

function openNote(id) {
  activeId = id; dirty = false;
  const n = notes.find(x => x.id === id); if (!n) return;
  document.getElementById('emptyState').style.display = 'none';
  const ec = document.getElementById('editorContent'); ec.style.display = 'flex';
  document.getElementById('noteTitleInput').value = n.title;
  document.getElementById('noteBody').value = n.body;
  document.getElementById('noteDateDisplay').textContent = n.date;
  document.getElementById('noteTagBadge').textContent = n.tag.charAt(0).toUpperCase() + n.tag.slice(1);
  document.getElementById('noteTagBadge').style.background = n.tagBg;
  document.getElementById('noteTagBadge').style.color = n.tagText;
  document.getElementById('noteBody').style.fontFamily = FONTS[n.font] || FONTS.playfair;
  document.getElementById('fontSelect').value = n.font;
  currentTag = { name: n.tag, color: n.tagColor, bg: n.tagBg, text: n.tagText };
  highlightTag(n.tagColor); updateCount(); renderList();
}

function newNote() {
  const n = { id: nextId++, title: '', body: '', tag: 'purple', tagColor: '#7F77DD', tagBg: '#EEEDFE', tagText: '#3C3489', font: 'playfair', date: fmtDate(new Date()) };
  notes.unshift(n); persist(); renderList(); openNote(n.id);
  setTimeout(() => document.getElementById('noteTitleInput').focus(), 50);
}

function saveNote() {
  if (!activeId) return;
  const n = notes.find(x => x.id === activeId); if (!n) return;
  n.title = document.getElementById('noteTitleInput').value || 'Untitled';
  n.body = document.getElementById('noteBody').value;
  n.tag = currentTag.name; n.tagColor = currentTag.color; n.tagBg = currentTag.bg; n.tagText = currentTag.text;
  n.font = document.getElementById('fontSelect').value;
  dirty = false; persist(); showToast('Note saved ✓'); renderList();
}

function onEdit() { dirty = true; }
function updateCount() { const t = document.getElementById('noteBody').value.trim(); const w = t ? t.split(/\s+/).length : 0; document.getElementById('wordCount').textContent = w + ' word' + (w !== 1 ? 's' : ''); }
function changeFont(v) { document.getElementById('noteBody').style.fontFamily = FONTS[v] || FONTS.playfair; onEdit(); }
function setTag(name, color, bg, text) { currentTag = { name, color, bg, text }; document.getElementById('noteTagBadge').textContent = name.charAt(0).toUpperCase() + name.slice(1); document.getElementById('noteTagBadge').style.background = bg; document.getElementById('noteTagBadge').style.color = text; highlightTag(color); onEdit(); }
function highlightTag(ac) { document.querySelectorAll('.color-tag').forEach(el => { el.classList.remove('sel'); if (el.style.background === ac) el.classList.add('sel'); }); }
function filterNotes() { renderList(); }

function openShare() {
  if (!activeId) return;
  const n = notes.find(x => x.id === activeId); if (!n) return;
  document.getElementById('shareSubtitle').textContent = `Share "${n.title || 'Untitled'}" with the world`;
  document.getElementById('shareLinkInput').value = window.location.href;
  document.getElementById('shareOverlay').classList.add('show');
}
function closeShare() { document.getElementById('shareOverlay').classList.remove('show'); }

function getShareText() { const n = notes.find(x => x.id === activeId); return n ? { title: n.title || 'Untitled', body: n.body || '' } : { title: '', body: '' }; }

function shareWhatsApp() { const { title, body } = getShareText(); const text = encodeURIComponent(`*${title}*\n\n${body}\n\n— shared from Nota`); window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank'); closeShare(); showToast('Opening WhatsApp...'); }
function shareTwitter() { const { title, body } = getShareText(); const snippet = body.length > 180 ? body.slice(0, 177) + '...' : body; const text = encodeURIComponent(`"${snippet}"\n\n— ${title} · via Nota`); window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank'); closeShare(); showToast('Opening X / Twitter...'); }
function shareEmail() { const { title, body } = getShareText(); const subject = encodeURIComponent(`Note: ${title}`); const bodyEnc = encodeURIComponent(`${title}\n${'─'.repeat(40)}\n\n${body}\n\n— Shared from Nota`); window.location.href = `mailto:?subject=${subject}&body=${bodyEnc}`; closeShare(); showToast('Opening email...'); }
function shareDownload() {
  const { title, body } = getShareText();
  const content = `${title}\n${'='.repeat(title.length)}\n\n${body}\n\n— Created in Nota`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = (title || 'note').replace(/\s+/g, '_') + '.txt';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  closeShare(); showToast('Note downloaded!');
}
function copyLink() { navigator.clipboard.writeText(document.getElementById('shareLinkInput').value).then(() => showToast('Link copied!')).catch(() => showToast('Copy the URL from your address bar')); }

function openConfirmDelete() { if (!activeId) return; document.getElementById('deleteOverlay').classList.add('show'); }
function closeDelete() { document.getElementById('deleteOverlay').classList.remove('show'); }
function doDelete() {
  notes = notes.filter(n => n.id !== activeId); persist();
  document.getElementById('deleteOverlay').classList.remove('show');
  activeId = null;
  document.getElementById('editorContent').style.display = 'none';
  document.getElementById('emptyState').style.display = 'flex';
  showToast('Note deleted'); renderList();
}

function showToast(msg) { const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2400); }

renderList();
if (notes.length) openNote(notes[0].id);
