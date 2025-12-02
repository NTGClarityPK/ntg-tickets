'use client';

import React from 'react';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { createLowlight } from 'lowlight';
import {
  IconColorPicker,
  IconTable,
  IconPhoto,
  IconCode,
  IconList,
  IconListNumbers,
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconQuote,
  IconMinus,
  IconClearFormatting,
  IconH1,
  IconH2,
  IconH3,
  IconH4,
  IconH5,
  IconH6,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconAlignJustified,
  IconHighlight,
  IconLink,
} from '@tabler/icons-react';
import { RTLArrowLeft, RTLArrowRight } from './RTLIcon';
import {
  Group,
  Stack,
  Text,
  Box,
  ActionIcon,
  Tooltip,
  ColorSwatch,
  Popover,
  Menu,
  MenuItem,
  MenuLabel,
  MenuTarget,
  MenuDropdown,
  useMantineTheme,
} from '@mantine/core';
import { showErrorNotification } from '@/lib/notifications';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  disabled?: boolean;
  error?: string | React.ReactNode;
  label?: string;
  description?: string;
  required?: boolean;
  withAsterisk?: boolean;
  allowImageUpload?: boolean;
  allowTableInsertion?: boolean;
  allowCodeBlocks?: boolean;
  allowHeadings?: boolean;
  allowLists?: boolean;
  allowTextFormatting?: boolean;
  allowTextAlignment?: boolean;
  allowTextColor?: boolean;
  allowHighlight?: boolean;
  allowLinks?: boolean;
  allowUndoRedo?: boolean;
  allowClearFormatting?: boolean;
  showToolbar?: boolean;
  toolbarPosition?: 'top' | 'bottom';
  toolbarSticky?: boolean;
  toolbarStickyOffset?: number;
  toolbarItems?: string[];
  customToolbarItems?: React.ReactNode[];
  onImageUpload?: (file: File) => Promise<string>;
  onTableInsert?: () => void;
  onCodeBlockInsert?: () => void;
  onHeadingInsert?: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onListInsert?: (type: 'bullet' | 'ordered') => void;
  onTextFormat?: (
    format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'
  ) => void;
  onTextAlign?: (align: 'left' | 'center' | 'right' | 'justify') => void;
  onTextColor?: (color: string) => void;
  onHighlight?: (color: string) => void;
  onLinkInsert?: (url: string, text: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onClearFormatting?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const defaultToolbarItems = [
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'code',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'bulletList',
  'orderedList',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'link',
  'image',
  'table',
  'textAlign',
  'textColor',
  'highlight',
  'undo',
  'redo',
  'clearFormatting',
];

const textColors = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#800080',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#FFA500',
  '#FFC0CB',
  '#FFD700',
  '#ADFF2F',
  '#FF69B4',
  '#87CEEB',
  '#DDA0DD',
  '#F0E68C',
];

const highlightColors = [
  '#FFFF00',
  '#FFA500',
  '#FF69B4',
  '#ADFF2F',
  '#87CEEB',
  '#DDA0DD',
  '#F0E68C',
  '#FFB6C1',
  '#98FB98',
  '#F0FFFF',
  '#F5DEB3',
  '#FFE4E1',
  '#E0FFFF',
  '#FFF8DC',
  '#F5F5DC',
  '#FFEFD5',
];

export const RichTextEditorComponent: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = 200,
  maxHeight = 400,
  disabled = false,
  error,
  label,
  description,
  required = false,
  withAsterisk = false,
  allowImageUpload = true,
  allowTableInsertion = true,
  allowCodeBlocks = true,
  allowHeadings = true,
  allowLists = true,
  allowTextFormatting = true,
  allowTextAlignment = true,
  allowTextColor = true,
  allowHighlight = true,
  allowLinks = true,
  allowUndoRedo = true,
  allowClearFormatting = true,
  showToolbar = true,
  toolbarPosition = 'top',
  toolbarSticky = false,
  toolbarStickyOffset = 0,
  toolbarItems = defaultToolbarItems,
  customToolbarItems = [],
  onImageUpload,
  onTableInsert,
  onCodeBlockInsert,
  onHeadingInsert,
  onListInsert,
  onTextFormat,
  onTextAlign,
  onTextColor,
  onHighlight,
  onLinkInsert,
  onUndo,
  onRedo,
  onClearFormatting,
  className,
  style,
}) => {
  const theme = useMantineTheme();
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Superscript,
      SubScript,
      Highlight.configure({ multicolor: true }),
      CodeBlockLowlight.configure({ lowlight: createLowlight() }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-500 underline cursor-pointer',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editable: !disabled,
    editorProps: {
      attributes: {
        placeholder: placeholder,
      },
    },
  });

  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = React.useState(false);

  const handleImageUpload = async (file: File) => {
    try {
      if (onImageUpload) {
        const url = await onImageUpload(file);
        editor?.chain().focus().setImage({ src: url, alt: '' }).run();
      } else {
        // Default behavior - convert to base64
        const reader = new FileReader();
        reader.onload = e => {
          const result = e.target?.result as string;
          editor?.chain().focus().setImage({ src: result, alt: '' }).run();
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      showErrorNotification('Upload Error', 'Failed to upload image');
    }
  };

  const handleTableInsert = () => {
    if (onTableInsert) {
      onTableInsert();
    } else {
      // Default behavior - insert a simple table
      editor
        ?.chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  };

  const handleCodeBlockInsert = () => {
    if (onCodeBlockInsert) {
      onCodeBlockInsert();
    } else {
      editor?.chain().focus().toggleCodeBlock().run();
    }
  };

  const handleHeadingInsert = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (onHeadingInsert) {
      onHeadingInsert(level);
    } else {
      editor?.chain().focus().toggleHeading({ level }).run();
    }
  };

  const handleListInsert = (type: 'bullet' | 'ordered') => {
    if (onListInsert) {
      onListInsert(type);
    } else {
      if (type === 'bullet') {
        editor?.chain().focus().toggleBulletList().run();
      } else {
        editor?.chain().focus().toggleOrderedList().run();
      }
    }
  };

  const handleTextFormat = (
    format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code'
  ) => {
    if (onTextFormat) {
      onTextFormat(format);
    } else {
      switch (format) {
        case 'bold':
          editor?.chain().focus().toggleBold().run();
          break;
        case 'italic':
          editor?.chain().focus().toggleItalic().run();
          break;
        case 'underline':
          editor?.chain().focus().toggleUnderline().run();
          break;
        case 'strikethrough':
          editor?.chain().focus().toggleStrike().run();
          break;
        case 'code':
          editor?.chain().focus().toggleCode().run();
          break;
      }
    }
  };

  const handleTextAlign = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (onTextAlign) {
      onTextAlign(align);
    } else {
      editor?.chain().focus().setTextAlign(align).run();
    }
  };

  const handleTextColor = (color: string) => {
    if (onTextColor) {
      onTextColor(color);
    } else {
      // Text color functionality - needs proper extension
      // editor?.chain().focus().setColor(color).run()
    }
  };

  const handleHighlight = (color: string) => {
    if (onHighlight) {
      onHighlight(color);
    } else {
      editor?.chain().focus().setHighlight({ color }).run();
    }
  };

  const handleLinkInsert = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      const text = window.prompt('Enter link text:', '');
      if (text) {
        if (onLinkInsert) {
          onLinkInsert(url, text);
        } else {
          editor
            ?.chain()
            .focus()
            .setLink({ href: url })
            .insertContent(text)
            .run();
        }
      }
    }
  };

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      editor?.chain().focus().undo().run();
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      onRedo();
    } else {
      editor?.chain().focus().redo().run();
    }
  };

  const handleClearFormatting = () => {
    if (onClearFormatting) {
      onClearFormatting();
    } else {
      editor?.chain().focus().clearNodes().unsetAllMarks().run();
    }
  };

  const renderToolbar = () => {
    if (!showToolbar || !editor) return null;

    const toolbarItemsToRender = toolbarItems.filter(item => {
      switch (item) {
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikethrough':
        case 'code':
          return allowTextFormatting;
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return allowHeadings;
        case 'bulletList':
        case 'orderedList':
          return allowLists;
        case 'codeBlock':
          return allowCodeBlocks;
        case 'table':
          return allowTableInsertion;
        case 'image':
          return allowImageUpload;
        case 'link':
          return allowLinks;
        case 'textAlign':
          return allowTextAlignment;
        case 'textColor':
          return allowTextColor;
        case 'highlight':
          return allowHighlight;
        case 'undo':
        case 'redo':
          return allowUndoRedo;
        case 'clearFormatting':
          return allowClearFormatting;
        default:
          return true;
      }
    });

    return (
      <Box
        style={{
          position: toolbarSticky ? 'sticky' : 'static',
          top: toolbarSticky ? toolbarStickyOffset : 'auto',
          zIndex: toolbarSticky ? 10 : 'auto',
          borderBottom: '1px solid #e9ecef',
          padding: '8px',
        }}
        data-testid="rich-text-editor-toolbar"
      >
        <Group gap='xs' wrap='wrap' data-testid="rich-text-editor-toolbar-group">
          {toolbarItemsToRender.map(item => {
            switch (item) {
              case 'bold':
                return (
                  <Tooltip label='Bold' key={item}>
                    <ActionIcon
                      variant={editor.isActive('bold') ? 'filled' : 'subtle'}
                      onClick={() => handleTextFormat('bold')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-bold"
                    >
                      <IconBold size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'italic':
                return (
                  <Tooltip label='Italic' key={item}>
                    <ActionIcon
                      variant={editor.isActive('italic') ? 'filled' : 'subtle'}
                      onClick={() => handleTextFormat('italic')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-italic"
                    >
                      <IconItalic size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'underline':
                return (
                  <Tooltip label='Underline' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('underline') ? 'filled' : 'subtle'
                      }
                      onClick={() => handleTextFormat('underline')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-underline"
                    >
                      <IconUnderline size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'strikethrough':
                return (
                  <Tooltip label='Strikethrough' key={item}>
                    <ActionIcon
                      variant={editor.isActive('strike') ? 'filled' : 'subtle'}
                      onClick={() => handleTextFormat('strikethrough')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-strikethrough"
                    >
                      <IconStrikethrough size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'code':
                return (
                  <Tooltip label='Code' key={item}>
                    <ActionIcon
                      variant={editor.isActive('code') ? 'filled' : 'subtle'}
                      onClick={() => handleTextFormat('code')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-code"
                    >
                      <IconCode size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h1':
                return (
                  <Tooltip label='Heading 1' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 1 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(1)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h1"
                    >
                      <IconH1 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h2':
                return (
                  <Tooltip label='Heading 2' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 2 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(2)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h2"
                    >
                      <IconH2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h3':
                return (
                  <Tooltip label='Heading 3' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 3 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(3)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h3"
                    >
                      <IconH3 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h4':
                return (
                  <Tooltip label='Heading 4' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 4 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(4)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h4"
                    >
                      <IconH4 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h5':
                return (
                  <Tooltip label='Heading 5' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 5 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(5)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h5"
                    >
                      <IconH5 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'h6':
                return (
                  <Tooltip label='Heading 6' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('heading', { level: 6 })
                          ? 'filled'
                          : 'subtle'
                      }
                      onClick={() => handleHeadingInsert(6)}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-h6"
                    >
                      <IconH6 size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'bulletList':
                return (
                  <Tooltip label='Bullet List' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('bulletList') ? 'filled' : 'subtle'
                      }
                      onClick={() => handleListInsert('bullet')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-bullet-list"
                    >
                      <IconList size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'orderedList':
                return (
                  <Tooltip label='Ordered List' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('orderedList') ? 'filled' : 'subtle'
                      }
                      onClick={() => handleListInsert('ordered')}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-ordered-list"
                    >
                      <IconListNumbers size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'blockquote':
                return (
                  <Tooltip label='Blockquote' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('blockquote') ? 'filled' : 'subtle'
                      }
                      onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                      }
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-blockquote"
                    >
                      <IconQuote size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'codeBlock':
                return (
                  <Tooltip label='Code Block' key={item}>
                    <ActionIcon
                      variant={
                        editor.isActive('codeBlock') ? 'filled' : 'subtle'
                      }
                      onClick={handleCodeBlockInsert}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-code-block"
                    >
                      <IconCode size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'horizontalRule':
                return (
                  <Tooltip label='Horizontal Rule' key={item}>
                    <ActionIcon
                      onClick={() =>
                        editor.chain().focus().setHorizontalRule().run()
                      }
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-horizontal-rule"
                    >
                      <IconMinus size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'link':
                return (
                  <Tooltip label='Link' key={item}>
                    <ActionIcon
                      variant={editor.isActive('link') ? 'filled' : 'subtle'}
                      onClick={handleLinkInsert}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-link"
                    >
                      <IconLink size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'image':
                return (
                  <Tooltip label='Image' key={item}>
                    <ActionIcon
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        };
                        input.click();
                      }}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-image"
                    >
                      <IconPhoto size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'table':
                return (
                  <Tooltip label='Table' key={item}>
                    <ActionIcon onClick={handleTableInsert} disabled={disabled} data-testid="rich-text-editor-toolbar-table">
                      <IconTable size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'textAlign':
                return (
                  <Menu key={item} data-testid="rich-text-editor-toolbar-text-align-menu">
                    <MenuTarget>
                      <ActionIcon disabled={disabled} data-testid="rich-text-editor-toolbar-text-align-button">
                        <IconAlignLeft size={16} />
                      </ActionIcon>
                    </MenuTarget>
                    <MenuDropdown data-testid="rich-text-editor-toolbar-text-align-dropdown">
                      <MenuLabel data-testid="rich-text-editor-toolbar-text-align-label">Text Alignment</MenuLabel>
                      <MenuItem
                        leftSection={<IconAlignLeft size={16} />}
                        onClick={() => handleTextAlign('left')}
                        data-testid="rich-text-editor-toolbar-text-align-left"
                      >
                        Left
                      </MenuItem>
                      <MenuItem
                        leftSection={<IconAlignCenter size={16} />}
                        onClick={() => handleTextAlign('center')}
                        data-testid="rich-text-editor-toolbar-text-align-center"
                      >
                        Center
                      </MenuItem>
                      <MenuItem
                        leftSection={<IconAlignRight size={16} />}
                        onClick={() => handleTextAlign('right')}
                        data-testid="rich-text-editor-toolbar-text-align-right"
                      >
                        Right
                      </MenuItem>
                      <MenuItem
                        leftSection={<IconAlignJustified size={16} />}
                        onClick={() => handleTextAlign('justify')}
                        data-testid="rich-text-editor-toolbar-text-align-justify"
                      >
                        Justify
                      </MenuItem>
                    </MenuDropdown>
                  </Menu>
                );
              case 'textColor':
                return (
                  <Popover
                    key={item}
                    opened={showColorPicker}
                    onClose={() => setShowColorPicker(false)}
                    position='bottom'
                    withArrow
                    data-testid="rich-text-editor-toolbar-text-color-popover"
                  >
                    <Popover.Target>
                      <ActionIcon
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        disabled={disabled}
                        data-testid="rich-text-editor-toolbar-text-color-button"
                      >
                        <IconColorPicker size={16} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown data-testid="rich-text-editor-toolbar-text-color-dropdown">
                      <Stack gap='xs'>
                        <Text size='sm' fw={500} data-testid="rich-text-editor-toolbar-text-color-title">
                          Text Color
                        </Text>
                        <Group gap='xs' data-testid="rich-text-editor-toolbar-text-color-swatches">
                          {textColors.map((color, index) => (
                            <ColorSwatch
                              key={color}
                              color={color}
                              size={20}
                              onClick={() => {
                                handleTextColor(color);
                                setShowColorPicker(false);
                              }}
                              style={{ cursor: 'pointer' }}
                              data-testid={`rich-text-editor-toolbar-text-color-swatch-${index}`}
                            />
                          ))}
                        </Group>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                );
              case 'highlight':
                return (
                  <Popover
                    key={item}
                    opened={showHighlightPicker}
                    onClose={() => setShowHighlightPicker(false)}
                    position='bottom'
                    withArrow
                    data-testid="rich-text-editor-toolbar-highlight-popover"
                  >
                    <Popover.Target>
                      <ActionIcon
                        onClick={() =>
                          setShowHighlightPicker(!showHighlightPicker)
                        }
                        disabled={disabled}
                        data-testid="rich-text-editor-toolbar-highlight-button"
                      >
                        <IconHighlight size={16} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown data-testid="rich-text-editor-toolbar-highlight-dropdown">
                      <Stack gap='xs'>
                        <Text size='sm' fw={500} data-testid="rich-text-editor-toolbar-highlight-title">
                          Highlight Color
                        </Text>
                        <Group gap='xs' data-testid="rich-text-editor-toolbar-highlight-swatches">
                          {highlightColors.map((color, index) => (
                            <ColorSwatch
                              key={color}
                              color={color}
                              size={20}
                              onClick={() => {
                                handleHighlight(color);
                                setShowHighlightPicker(false);
                              }}
                              style={{ cursor: 'pointer' }}
                              data-testid={`rich-text-editor-toolbar-highlight-swatch-${index}`}
                            />
                          ))}
                        </Group>
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                );
              case 'undo':
                return (
                  <Tooltip label='Undo' key={item}>
                    <ActionIcon
                      onClick={handleUndo}
                      disabled={disabled || !editor.can().undo()}
                      data-testid="rich-text-editor-toolbar-undo"
                    >
                      <RTLArrowLeft size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'redo':
                return (
                  <Tooltip label='Redo' key={item}>
                    <ActionIcon
                      onClick={handleRedo}
                      disabled={disabled || !editor.can().redo()}
                      data-testid="rich-text-editor-toolbar-redo"
                    >
                      <RTLArrowRight size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              case 'clearFormatting':
                return (
                  <Tooltip label='Clear Formatting' key={item}>
                    <ActionIcon
                      onClick={handleClearFormatting}
                      disabled={disabled}
                      data-testid="rich-text-editor-toolbar-clear-formatting"
                    >
                      <IconClearFormatting size={16} />
                    </ActionIcon>
                  </Tooltip>
                );
              default:
                return null;
            }
          })}

          {customToolbarItems}
        </Group>
      </Box>
    );
  };

  return (
    <Stack gap='xs' className={className} style={style} data-testid="rich-text-editor-wrapper">
      {label && (
        <Text size='sm' fw={500} data-testid="rich-text-editor-label">
          {label}
          {required && withAsterisk && (
            <Text component='span' c={theme.colors[theme.primaryColor][9]} data-testid="rich-text-editor-required-asterisk">
              {' '}
              *
            </Text>
          )}
        </Text>
      )}

      {description && (
        <Text size='xs' c='dimmed' data-testid="rich-text-editor-description">
          {description}
        </Text>
      )}

      <Box
        style={{
          border: error
            ? `1px solid ${theme.colors.red[6]}`
            : `1px solid ${theme.colors.gray[3]}`,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
        data-testid="rich-text-editor-container"
      >
        {toolbarPosition === 'top' && renderToolbar()}

        <RichTextEditor
          editor={editor}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          data-testid="rich-text-editor"
        >
          <RichTextEditor.Content
            style={{
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              overflow: 'auto',
            }}
            data-testid="rich-text-editor-content"
          />
        </RichTextEditor>

        {toolbarPosition === 'bottom' && renderToolbar()}
      </Box>

      {error && (
        <Text size='xs' c={theme.colors[theme.primaryColor][9]} data-testid="rich-text-editor-error">
          {error}
        </Text>
      )}
    </Stack>
  );
};

export default RichTextEditorComponent;
