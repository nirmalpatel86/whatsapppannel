import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { FiBold, FiItalic, FiUnderline, FiList, FiLink, FiRotateCcw } from 'react-icons/fi';

const ToolBtn = ({ onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onMouseDown={e => e.preventDefault()}
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: 30, height: 30, border: '1px solid #e5e7eb', borderRadius: 6,
      background: 'white', cursor: 'pointer', color: '#374151',
    }}
  >
    {children}
  </button>
);

// A small dependency-free rich text editor — contentEditable + document.execCommand.
// Exposes insertText(text) via ref so a parent can insert merge-tag variables at the cursor.
const RichTextEditor = forwardRef(({ value, onChange, placeholder, minHeight = 240 }, ref) => {
  const editorRef = useRef(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const handleInput = () => {
    const html = editorRef.current?.innerHTML || '';
    lastValueRef.current = html;
    onChange(html);
  };

  const exec = (cmd, arg = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    handleInput();
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL');
    if (url) exec('createLink', url);
  };

  const insertText = (text) => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, text);
    handleInput();
  };

  useImperativeHandle(ref, () => ({ insertText }));

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
      <div style={{ display: 'flex', gap: 6, padding: 8, borderBottom: '1px solid #e5e7eb', background: '#f9fafb', flexWrap: 'wrap' }}>
        <ToolBtn title="Bold" onClick={() => exec('bold')}><FiBold size={14} /></ToolBtn>
        <ToolBtn title="Italic" onClick={() => exec('italic')}><FiItalic size={14} /></ToolBtn>
        <ToolBtn title="Underline" onClick={() => exec('underline')}><FiUnderline size={14} /></ToolBtn>
        <ToolBtn title="Bullet list" onClick={() => exec('insertUnorderedList')}><FiList size={14} /></ToolBtn>
        <ToolBtn title="Insert link" onClick={insertLink}><FiLink size={14} /></ToolBtn>
        <ToolBtn title="Clear formatting" onClick={() => exec('removeFormat')}><FiRotateCcw size={14} /></ToolBtn>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rte-editable"
        style={{ minHeight, padding: 14, fontSize: 15, outline: 'none', lineHeight: 1.6, color: '#111827', overflow: 'auto' }}
        suppressContentEditableWarning
      />
    </div>
  );
});

export default RichTextEditor;
