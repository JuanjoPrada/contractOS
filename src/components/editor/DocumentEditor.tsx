'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Save,
    X,
    Heading,
    Undo,
    Redo,
    Highlighter
} from 'lucide-react'
import styles from './DocumentEditor.module.css'
import { useState } from 'react'

interface DocumentEditorProps {
    initialContent: string
    onSave: (content: string) => Promise<void>
    onCancel: () => void
}

export function DocumentEditor({ initialContent, onSave, onCancel }: DocumentEditorProps) {
    const [isSaving, setIsSaving] = useState(false)

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight,
            Placeholder.configure({
                placeholder: 'Escribe el contenido del contrato aquí...',
            }),
        ],
        content: initialContent,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: styles.editorContent,
            },
        },
    })

    if (!editor) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(editor.getHTML())
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className={styles.editorViewport}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.isActive : ''}`}
                    title="Negrita"
                >
                    <Bold size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.isActive : ''}`}
                    title="Cursiva"
                >
                    <Italic size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`${styles.toolbarButton} ${editor.isActive('underline') ? styles.isActive : ''}`}
                    title="Subrayado"
                >
                    <UnderlineIcon size={18} />
                </button>

                <div className={styles.divider} />

                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 1 }) ? styles.isActive : ''}`}
                    title="Título 1"
                >
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>H1</span>
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`${styles.toolbarButton} ${editor.isActive('heading', { level: 2 }) ? styles.isActive : ''}`}
                    title="Título 2"
                >
                    <span style={{ fontWeight: 'bold', fontSize: '12px' }}>H2</span>
                </button>

                <div className={styles.divider} />

                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`${styles.toolbarButton} ${editor.isActive({ textAlign: 'left' }) ? styles.isActive : ''}`}
                    title="Alinear izquierda"
                >
                    <AlignLeft size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`${styles.toolbarButton} ${editor.isActive({ textAlign: 'center' }) ? styles.isActive : ''}`}
                    title="Centrar"
                >
                    <AlignCenter size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`${styles.toolbarButton} ${editor.isActive({ textAlign: 'right' }) ? styles.isActive : ''}`}
                    title="Alinear derecha"
                >
                    <AlignRight size={18} />
                </button>

                <div className={styles.divider} />

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.isActive : ''}`}
                    title="Lista"
                >
                    <List size={18} />
                </button>

                <div className={styles.divider} />

                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    className={styles.toolbarButton}
                    title="Deshacer"
                >
                    <Undo size={18} />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    className={styles.toolbarButton}
                    title="Rehacer"
                >
                    <Redo size={18} />
                </button>
            </div>

            {/* A4 Document Layout */}
            <div className={styles.documentContainer}>
                <EditorContent editor={editor} className={styles.editor} />
            </div>

            {/* Action Buttons */}
            <div className={styles.saveActions}>
                <button
                    className="btn btn-secondary"
                    onClick={onCancel}
                    disabled={isSaving}
                >
                    <X size={18} style={{ marginRight: '8px' }} />
                    Cancelar
                </button>
                <button
                    className="btn"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    <Save size={18} style={{ marginRight: '8px' }} />
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    )
}
