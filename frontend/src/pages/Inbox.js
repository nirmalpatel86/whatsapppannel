import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';
import alert from '../utils/alert';
import { FiSend, FiSearch, FiPaperclip, FiMessageSquare, FiPhone, FiArrowDown, FiPlus, FiX, FiCheck, FiFileText, FiFile, FiTrash2, FiMoreVertical, FiSmile } from 'react-icons/fi';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4001';

// WhatsApp's own palette, so the chat screen reads like the real app.
const WA_HEADER = '#008069';
const WA_GREEN = '#00a884';
const WA_OUTBOUND = '#d9fdd3';
const WA_WALLPAPER = '#efeae2';
const WA_TICK_READ = '#53bdeb';
const WA_ICON = '#54656f';

// Common emoji, grouped loosely so the picker doesn't feel like a wall of icons.
const EMOJI_LIST = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😜', '🤔', '😎',
  '😅', '😇', '🥰', '😋', '😴', '🙄', '😬', '😢', '😭', '😡',
  '🥳', '🤗', '🤒', '😱', '🙏', '👍', '👎', '👏', '💪', '🙌',
  '👌', '✌️', '🤝', '👋', '❤️', '💔', '💯', '🔥', '🎉', '✨',
  '⚡', '🌟', '☀️', '🌙', '🎁', '📞', '📱', '💰', '🕒', '📍',
];

const EmojiPicker = ({ onSelect }) => (
  <div style={styles.emojiPicker}>
    {EMOJI_LIST.map((emoji, i) => (
      <button key={i} onClick={() => onSelect(emoji)} style={styles.emojiBtn} type="button">
        {emoji}
      </button>
    ))}
  </div>
);

// Renders WhatsApp-style *bold*, _italic_, ~strikethrough~ and ```monospace``` markers.
const formatMessageBody = (text) => {
  if (!text) return null;
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|```[^`\n]+```)/g;
  return text.split(regex).map((part, i) => {
    if (!part) return null;
    if (/^\*[^*\n]+\*$/.test(part)) return <strong key={i}>{part.slice(1, -1)}</strong>;
    if (/^_[^_\n]+_$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^~[^~\n]+~$/.test(part)) return <s key={i}>{part.slice(1, -1)}</s>;
    if (/^```[^`\n]+```$/.test(part)) return <code key={i} style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3 }}>{part.slice(3, -3)}</code>;
    return part;
  });
};

const Inbox = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [compose, setCompose] = useState({ phone: '', whatsappAccountId: '', body: '' });
  const [contactSearch, setContactSearch] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [pendingFile, setPendingFile] = useState(null);
  const [hoveredMsg, setHoveredMsg] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);

  const insertEmoji = (emoji) => {
    const el = messageInputRef.current;
    const start = el?.selectionStart ?? newMessage.length;
    const end = el?.selectionEnd ?? newMessage.length;
    const updated = newMessage.slice(0, start) + emoji + newMessage.slice(end);
    setNewMessage(updated);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    });
  };

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/chats', { params: { search: search || undefined } });
      setChats(res.data.chats);
    } catch (err) {
      console.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (showCompose) {
      Promise.all([
        api.get('/whatsapp/accounts'),
        api.get('/contacts?limit=1000'),
      ]).then(([accRes, contRes]) => {
        const connected = accRes.data.accounts.filter(a => a.status === 'connected');
        setAccounts(connected);
        setContacts(contRes.data.contacts);
        if (connected.length === 1) {
          setCompose(c => ({ ...c, whatsappAccountId: String(connected[0].id) }));
        }
      }).catch(() => alert.error('Failed to load accounts'));
    }
  }, [showCompose]);

  useEffect(() => {
    api.get('/templates').then(res => setTemplates(res.data.templates || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = ({ message, chat, contact }) => {
      setChats(prev => {
        const exists = prev.find(c => c.id === chat.id);
        if (exists) {
          return prev.map(c => c.id === chat.id
            ? { ...c, lastMessage: chat.lastMessage, lastMessageAt: chat.lastMessageAt, unreadCount: c.id === selectedChat?.id ? 0 : chat.unreadCount, Contact: c.Contact || contact }
            : c
          ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
        }
        return [{ ...chat, Contact: contact }, ...prev];
      });
      if (selectedChat?.id === chat.id) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleMessageStatus = ({ messageId, chatId, status }) => {
      if (selectedChat?.id === chatId) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, status } : m
        ));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_status', handleMessageStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_status', handleMessageStatus);
    };
  }, [selectedChat]);

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    setShowCompose(false);
    setShowTemplates(false);
    setShowChatMenu(false);
    try {
      const res = await api.get(`/chats/${chat.id}/messages`);
      setMessages(res.data.messages);
      setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      alert.error('Failed to load messages');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!newMessage) autoGrowMessageInput(messageInputRef.current);
  }, [newMessage]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      const res = await api.post(`/chats/${selectedChat.id}/messages`, { body: newMessage, type: 'text' });
      setMessages(prev => [...prev, res.data.message]);
      setNewMessage('');
      setChats(prev => prev.map(c =>
        c.id === selectedChat.id ? { ...c, lastMessage: newMessage, lastMessageAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const sendAttachment = async () => {
    if (!selectedChat || sending || !pendingFile) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('caption', newMessage.trim());
      const res = await api.post(`/chats/${selectedChat.id}/messages/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages(prev => [...prev, res.data.message]);
      setChats(prev => prev.map(c =>
        c.id === selectedChat.id ? { ...c, lastMessage: newMessage.trim() || `[${res.data.message.type}]`, lastMessageAt: new Date().toISOString() } : c
      ));
      setPendingFile(null);
      setNewMessage('');
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to send attachment');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chats/messages/${messageId}`);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, body: '', mediaUrl: null, isDeleted: true } : m));
    } catch (err) {
      alert.error('Failed to delete message');
    }
  };

  const clearChat = async () => {
    if (!selectedChat) return;
    if (!window.confirm('Clear all messages in this chat? This cannot be undone.')) return;
    try {
      await api.delete(`/chats/${selectedChat.id}/messages`);
      setMessages([]);
      setChats(prev => prev.map(c => c.id === selectedChat.id ? { ...c, lastMessage: '', unreadCount: 0 } : c));
      setShowChatMenu(false);
    } catch (err) {
      alert.error('Failed to clear chat');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = '';
  };

  const sendNewChat = async () => {
    if (!compose.phone.trim() || !compose.whatsappAccountId || !compose.body.trim()) {
      alert.error('Fill all fields: account, phone, and message');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/chats/send', {
        whatsappAccountId: parseInt(compose.whatsappAccountId),
        phone: compose.phone.trim(),
        body: compose.body,
        type: 'text',
      });
      alert.success('Message sent!');
      setShowCompose(false);
      setCompose({ phone: '', whatsappAccountId: '', body: '' });
      setContactSearch('');
      await fetchChats();
      if (res.data.chat) {
        const chatRes = await api.get(`/chats/${res.data.chat.id}/messages`);
        setSelectedChat({ ...res.data.chat, Contact: { phone: compose.phone, name: compose.phone } });
        setMessages(chatRes.data.messages);
      }
    } catch (err) {
      alert.error(err.response?.data?.error || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (template) => {
    if (showCompose) {
      setCompose(c => ({ ...c, body: template.body }));
    } else {
      setNewMessage(template.body);
    }
    setShowTemplates(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (pendingFile) sendAttachment();
      else sendMessage();
    }
  };

  const autoGrowMessageInput = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const groupMessagesByDate = (msgs) => {
    const grouped = [];
    let lastDate = null;
    for (const msg of msgs) {
      const msgDate = new Date(msg.timestamp).toDateString();
      if (msgDate !== lastDate) {
        grouped.push({ type: 'date', date: msg.timestamp });
        lastDate = msgDate;
      }
      grouped.push({ type: 'message', data: msg });
    }
    return grouped;
  };

  const StatusTicks = ({ status }) => {
    if (status === 'read') return <span style={{ color: WA_TICK_READ, marginLeft: 4 }}>✓✓</span>;
    if (status === 'delivered') return <span style={{ color: '#8696a0', marginLeft: 4 }}>✓✓</span>;
    if (status === 'sent') return <span style={{ color: '#8696a0', marginLeft: 4 }}>✓</span>;
    if (status === 'failed') return <span style={{ color: '#ef4444', marginLeft: 4 }}>!</span>;
    return <span style={{ color: '#8696a0', marginLeft: 4 }}>○</span>;
  };

  const MediaPreview = ({ msg }) => {
    const url = msg.mediaUrl ? `${API_BASE}${msg.mediaUrl}` : null;
    if (!url) return null;
    if (msg.type === 'image') {
      return <img src={url} alt="media" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, marginBottom: 4, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />;
    }
    if (msg.type === 'video') {
      return <video src={url} controls style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 8, marginBottom: 4 }} />;
    }
    if (msg.type === 'audio') {
      return <audio src={url} controls style={{ maxWidth: '100%', marginBottom: 4 }} />;
    }
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#f3f4f6', borderRadius: 8, marginBottom: 4, textDecoration: 'none', color: '#374151', fontSize: 14 }}>
        <FiFile size={18} /> {msg.body || 'Document'}
      </a>
    );
  };

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q);
  });

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>
      {/* Chat list */}
      <div style={styles.chatList}>
        <div style={styles.chatListHeader}>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: '#111827', flex: 1 }}>
            Chats {totalUnread > 0 && <span style={styles.totalBadge}>{totalUnread}</span>}
          </h3>
          <button onClick={() => { setShowCompose(true); setSelectedChat(null); }} style={styles.composeBtn} title="New Message">
            <FiPlus size={18} />
          </button>
        </div>
        <div style={styles.searchBar}>
          <FiSearch size={15} color="#9ca3af" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search chats..." style={styles.searchInput} />
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat)}
              style={{
                ...styles.chatItem,
                background: selectedChat?.id === chat.id ? '#f0f2f5' : 'white',
              }}
            >
              <div style={{
                ...styles.avatar,
                background: chat.unreadCount > 0 ? WA_GREEN : '#374151',
                color: 'white',
              }}>
                {(chat.Contact?.name || chat.Contact?.phone || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: chat.unreadCount > 0 ? 700 : 500, fontSize: 15, color: '#111827' }}>
                    {chat.Contact?.name || chat.Contact?.phone}
                  </span>
                  <span style={{ fontSize: 12, color: chat.unreadCount > 0 ? WA_GREEN : '#9ca3af', fontWeight: chat.unreadCount > 0 ? 600 : 400 }}>
                    {formatTime(chat.lastMessageAt)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{
                    fontSize: 14, color: chat.unreadCount > 0 ? '#374151' : '#9ca3af',
                    fontWeight: chat.unreadCount > 0 ? 500 : 400,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230,
                  }}>
                    {chat.lastMessage || 'No messages'}
                  </span>
                  {chat.unreadCount > 0 && <span style={styles.badge}>{chat.unreadCount}</span>}
                </div>
              </div>
            </div>
          ))}
          {chats.length === 0 && !loading && (
            <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
              <FiMessageSquare size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 15 }}>No conversations yet</p>
              <button onClick={() => setShowCompose(true)} style={{ ...styles.composeBtn, marginTop: 12, padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
                <FiPlus size={14} /> Start a conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message area */}
      <div style={styles.messageArea}>
        {showCompose ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={styles.chatHeader}>
              <FiSend size={20} color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'white' }}>New Message</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Send a message to any contact or phone number</div>
              </div>
              <button onClick={() => setShowCompose(false)} style={{ ...styles.iconBtn, color: 'white' }}><FiX size={18} /></button>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
              <div style={{ maxWidth: 500, margin: '0 auto' }}>
                {accounts.length > 1 ? (
                  <div style={{ marginBottom: 16 }}>
                    <label style={styles.label}>WhatsApp Account *</label>
                    <select value={compose.whatsappAccountId} onChange={e => setCompose({ ...compose, whatsappAccountId: e.target.value })} style={styles.composeInput}>
                      <option value="">Select account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.phone})</option>)}
                    </select>
                  </div>
                ) : accounts.length === 1 ? (
                  <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiPhone size={14} color="#00a884" />
                    <span style={{ fontSize: 14, color: '#374151' }}>Sending via <strong>{accounts[0].name}</strong> ({accounts[0].phone})</span>
                  </div>
                ) : (
                  <div style={{ marginBottom: 16, padding: '12px 14px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', fontSize: 14, color: '#ef4444' }}>
                    No connected WhatsApp account. Please connect one first.
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Recipient Phone *</label>
                  <input value={compose.phone} onChange={e => setCompose({ ...compose, phone: e.target.value })} style={styles.composeInput} placeholder="919876543210" />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={styles.label}>Or pick a contact</label>
                  <div style={styles.contactPicker}>
                    <div style={styles.pickerSearch}>
                      <FiSearch size={14} color="#9ca3af" />
                      <input value={contactSearch} onChange={e => setContactSearch(e.target.value)} placeholder="Search contacts..." style={styles.pickerInput} />
                    </div>
                    <div style={{ maxHeight: 180, overflow: 'auto' }}>
                      {filteredContacts.slice(0, 50).map(c => (
                        <div key={c.id} onClick={() => setCompose({ ...compose, phone: c.phone })} style={{ ...styles.contactOption, background: compose.phone === c.phone ? '#00a88412' : 'transparent' }}>
                          <div style={styles.miniAvatar}>{(c.name || c.phone)[0].toUpperCase()}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{c.name || c.phone}</div>
                            <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.phone}</div>
                          </div>
                          {compose.phone === c.phone && <FiCheck size={16} color="#00a884" />}
                        </div>
                      ))}
                      {filteredContacts.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No contacts found</div>}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ ...styles.label, marginBottom: 0 }}>Message *</label>
                    <button onClick={() => setShowTemplates(!showTemplates)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: showTemplates ? '#00a88420' : '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      <FiFileText size={12} /> Templates
                    </button>
                  </div>
                  {showTemplates && templates.length > 0 && (
                    <div style={{ marginBottom: 8, maxHeight: 150, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
                      {templates.map(t => (
                        <div key={t.id} onClick={() => applyTemplate(t)} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 14, color: '#374151' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#00a884', marginBottom: 2 }}>{t.name}</div>
                          <div style={{ color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <textarea value={compose.body} onChange={e => setCompose({ ...compose, body: e.target.value })} style={{ ...styles.composeInput, minHeight: 100, resize: 'vertical' }} placeholder="Type your message..." onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendNewChat(); } }} />
                </div>

                <button onClick={sendNewChat} disabled={sending} style={styles.sendNewBtn}>
                  <FiSend size={16} /> {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        ) : selectedChat ? (
          <>
            <div style={styles.chatHeader}>
              <div style={{ ...styles.avatar, width: 40, height: 40, background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                {(selectedChat.Contact?.name || selectedChat.Contact?.phone || '?')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'white' }}>
                  {selectedChat.Contact?.name || selectedChat.Contact?.phone}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiPhone size={10} />
                  {selectedChat.Contact?.phone}
                  {selectedChat.WhatsappAccount && ` · via ${selectedChat.WhatsappAccount.name}`}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowChatMenu(!showChatMenu)} style={{ ...styles.iconBtn, color: 'white' }} title="Chat options">
                  <FiMoreVertical size={18} />
                </button>
                {showChatMenu && (
                  <div style={styles.chatMenu}>
                    <button onClick={clearChat} style={styles.chatMenuItem}>
                      <FiTrash2 size={14} /> Clear chat
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div ref={messagesContainerRef} onScroll={handleScroll} style={styles.messages}>
              {groupMessagesByDate(messages).map((item, i) => {
                if (item.type === 'date') {
                  return (
                    <div key={`date-${i}`} style={styles.dateDivider}>
                      <span style={styles.dateLabel}>{formatDate(item.date)}</span>
                    </div>
                  );
                }
                const msg = item.data;
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div
                    key={msg.id || i}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => setHoveredMsg(prev => (prev === msg.id ? null : prev))}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 6, justifyContent: isOutbound ? 'flex-end' : 'flex-start', flexDirection: isOutbound ? 'row-reverse' : 'row' }}
                  >
                    <div style={{ ...styles.messageBubble, background: isOutbound ? WA_OUTBOUND : 'white', borderBottomRightRadius: isOutbound ? 2 : 7, borderBottomLeftRadius: isOutbound ? 7 : 2 }}>
                      {msg.isDeleted ? (
                        <div style={{ fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>This message was deleted</div>
                      ) : (
                        <>
                          {msg.mediaUrl && <MediaPreview msg={msg} />}
                          {msg.type !== 'text' && !msg.mediaUrl && <div style={styles.mediaTag}>{msg.type}</div>}
                          {msg.body && <div style={{ fontSize: 15, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap', color: '#111827' }}>{formatMessageBody(msg.body)}</div>}
                          {!msg.body && !msg.mediaUrl && <div style={{ fontSize: 15, color: '#9ca3af' }}>[{msg.type}]</div>}
                        </>
                      )}
                      <div style={styles.msgMeta}>
                        {formatTime(msg.timestamp)}
                        {isOutbound && <StatusTicks status={msg.status} />}
                      </div>
                    </div>
                    {isOutbound && !msg.isDeleted && hoveredMsg === msg.id && (
                      <button onClick={() => deleteMessage(msg.id)} style={styles.msgDeleteBtn} title="Delete message">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {showScrollBtn && (
              <button onClick={scrollToBottom} style={styles.scrollBtn}><FiArrowDown size={18} /></button>
            )}

            {showTemplates && templates.length > 0 && (
              <div style={{ padding: '8px 16px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', maxHeight: 160, overflow: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Templates</span>
                  <button onClick={() => setShowTemplates(false)} style={styles.iconBtn}><FiX size={14} /></button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {templates.map(t => (
                    <button key={t.id} onClick={() => applyTemplate(t)} style={{ padding: '6px 12px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showEmojiPicker && (
              <EmojiPicker onSelect={insertEmoji} />
            )}

            {pendingFile && (
              <div style={styles.filePreviewBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  {pendingFile.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(pendingFile)} alt="preview" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiFile size={18} color="#6b7280" /></div>
                  )}
                  <span style={{ fontSize: 14, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>({(pendingFile.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button onClick={() => setPendingFile(null)} style={styles.iconBtn} title="Remove"><FiX size={18} /></button>
              </div>
            )}

            <div style={styles.inputArea}>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" />
              <button onClick={() => { setShowEmojiPicker(false); fileInputRef.current?.click(); }} style={styles.iconBtn} title="Send attachment"><FiPaperclip size={20} /></button>
              <button onClick={() => { setShowTemplates(!showTemplates); setShowEmojiPicker(false); }} style={{ ...styles.iconBtn, color: showTemplates ? '#00a884' : '#9ca3af' }} title="Templates"><FiFileText size={19} /></button>
              <button onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTemplates(false); }} style={{ ...styles.iconBtn, color: showEmojiPicker ? '#00a884' : '#9ca3af' }} title="Emoji"><FiSmile size={20} /></button>
              <textarea
                ref={messageInputRef}
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); autoGrowMessageInput(e.target); }}
                onKeyDown={handleKeyPress}
                placeholder={pendingFile ? "Add a caption (optional)..." : "Type a message..."}
                rows={1}
                style={styles.messageInput}
              />
              <button onClick={pendingFile ? sendAttachment : sendMessage} disabled={sending || (!pendingFile && !newMessage.trim())} style={{ ...styles.sendBtn, opacity: (pendingFile || newMessage.trim()) ? 1 : 0.4 }}>
                <FiSend size={17} />
              </button>
            </div>
          </>
        ) : (
          <div style={styles.noChat}>
            <div style={styles.noChatIcon}>
              <FiMessageSquare size={40} color="#00a884" />
            </div>
            <h3 style={{ color: '#111827', margin: '20px 0 8px', fontWeight: 600, fontSize: 19 }}>Leadofy Messenger</h3>
            <p style={{ color: '#9ca3af', margin: '0 0 20px', fontSize: 15, maxWidth: 320, textAlign: 'center', lineHeight: 1.5 }}>
              Select a conversation or start a new one. Incoming messages appear here in real-time.
            </p>
            <button onClick={() => setShowCompose(true)} style={styles.sendNewBtn}>
              <FiPlus size={16} /> New Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  chatList: { width: 380, borderRight: '1px solid #d1d7db', display: 'flex', flexDirection: 'column', background: 'white', flexShrink: 0 },
  chatListHeader: { padding: '18px 16px 12px', display: 'flex', alignItems: 'center' },
  totalBadge: { fontSize: 11, fontWeight: 700, background: WA_GREEN, color: 'white', borderRadius: 10, padding: '2px 8px', marginLeft: 6, verticalAlign: 'middle' },
  composeBtn: { display: 'flex', alignItems: 'center', gap: 4, padding: 8, background: WA_GREEN, color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  searchBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 10px' },
  searchInput: { flex: 1, padding: '8px 12px', border: 'none', borderRadius: 18, background: '#f0f2f5', fontSize: 13, outline: 'none', color: '#111827' },
  chatItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.12s' },
  avatar: { width: 42, height: 42, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  badge: { background: WA_GREEN, color: 'white', borderRadius: 12, padding: '1px 7px', fontSize: 11, fontWeight: 700, minWidth: 18, textAlign: 'center', flexShrink: 0 },
  messageArea: { flex: 1, display: 'flex', flexDirection: 'column', background: WA_WALLPAPER, position: 'relative' },
  chatHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: WA_HEADER, borderBottom: 'none' },
  messages: { flex: 1, overflow: 'auto', padding: '12px 48px', display: 'flex', flexDirection: 'column', gap: 3 },
  dateDivider: { display: 'flex', justifyContent: 'center', margin: '14px 0 8px' },
  dateLabel: { padding: '4px 10px', background: 'white', borderRadius: 6, fontSize: 11, fontWeight: 500, color: '#54656f', boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' },
  messageBubble: { maxWidth: '60%', padding: '7px 11px 4px', borderRadius: 7, marginBottom: 2, boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)' },
  mediaTag: { display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase' },
  msgMeta: { fontSize: 10, color: '#667781', textAlign: 'right', marginTop: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' },
  scrollBtn: { position: 'absolute', bottom: 80, right: 24, width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: WA_ICON, zIndex: 10 },
  filePreviewBar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#f0f2f5', borderTop: '1px solid #e9edef' },
  inputArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#f0f2f5', borderTop: 'none' },
  messageInput: { flex: 1, padding: '9px 16px', border: 'none', borderRadius: 22, fontSize: 14, outline: 'none', background: 'white', color: '#111827', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 120, overflowY: 'auto', boxSizing: 'border-box' },
  emojiPicker: { display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, padding: '10px 16px', background: '#f0f2f5', borderTop: '1px solid #e9edef', maxHeight: 160, overflow: 'auto' },
  emojiBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6, lineHeight: 1 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: WA_ICON, padding: 4 },
  sendBtn: { background: WA_GREEN, color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'opacity 0.2s' },
  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: WA_WALLPAPER },
  noChatIcon: { width: 88, height: 88, borderRadius: '50%', background: '#00a88412', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #00a88425' },
  label: { display: 'block', marginBottom: 6, fontWeight: 500, color: '#374151', fontSize: 14 },
  composeInput: { width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box', background: '#f9fafb' },
  contactPicker: { border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' },
  pickerSearch: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' },
  pickerInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#111827' },
  contactOption: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f9fafb' },
  miniAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#374151', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13, flexShrink: 0 },
  sendNewBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 24px', background: WA_GREEN, color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: 15, width: '100%', boxShadow: '0 2px 8px rgba(0,168,132,0.25)' },
  msgDeleteBtn: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', flexShrink: 0 },
  chatMenu: { position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'white', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 150, overflow: 'hidden' },
  chatMenuItem: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'white', border: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' },
};

export default Inbox;
