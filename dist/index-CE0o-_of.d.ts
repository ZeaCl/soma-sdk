import React from 'react';
import { b as SomaFile, d as SomaSkill } from './index-B9tVZyfw.js';

interface SomaChatProps {
    agentId: string;
    conversationId?: string;
    apiKey?: string;
    baseUrl?: string;
    placeholder?: string;
    welcomeMessage?: string;
    /** CSS class applied to root element */
    className?: string;
    /** Quick color overrides — for full control use CSS variables on parent */
    colors?: Partial<SomaChatColors>;
    /** Custom render functions for specific parts */
    renderMessage?: (msg: SomaChatMessage, defaultRender: React.ReactNode) => React.ReactNode;
    renderInput?: (defaultRender: React.ReactNode) => React.ReactNode;
}
interface SomaChatColors {
    bg: string;
    text: string;
    textMuted: string;
    userBubble: string;
    userBubbleText: string;
    agentBubble: string;
    agentBubbleText: string;
    thinkingBg: string;
    thinkingText: string;
    thinkingBorder: string;
    toolBg: string;
    toolText: string;
    toolBorder: string;
    resultBg: string;
    resultText: string;
    resultBorder: string;
    inputBg: string;
    inputBorder: string;
    primary: string;
    primaryText: string;
    font: string;
    radius: string;
}
interface SomaChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    thinking?: string;
    timestamp: Date;
}
declare function SomaChat({ agentId, conversationId, apiKey, baseUrl, placeholder, welcomeMessage, className, colors: colorsOverride, renderMessage, renderInput, }: SomaChatProps): React.JSX.Element;

interface SomaCopilotProps {
    agentId: string;
    apiKey?: string;
    baseUrl?: string;
    open?: boolean;
    onClose?: () => void;
}
declare function SomaCopilot({ agentId, apiKey, baseUrl, open, onClose }: SomaCopilotProps): React.JSX.Element;

interface SomaConversationListProps {
    conversations: Array<{
        id: string;
        title: string;
        lastMessageAt: string;
        messageCount: number;
    }>;
    activeId?: string;
    onSelect?: (id: string) => void;
    onNew?: (agentId: string) => void;
    agents?: Array<{
        id: string;
        name: string;
    }>;
}
declare function SomaConversationList({ conversations, activeId, onSelect, agents }: SomaConversationListProps): React.JSX.Element;

interface SomaFileBrowserProps {
    files: SomaFile[];
    loading?: boolean;
    onSelect?: (file: SomaFile) => void;
    onUpload?: (name: string, data: string, path?: string) => Promise<boolean>;
    onMkdir?: (path: string) => Promise<void>;
    onDelete?: (path: string) => Promise<void>;
    onRename?: (path: string, newName: string) => Promise<void>;
    /** Si se provee, muestra contenido del archivo al clickear */
    readFile?: (path: string) => Promise<string | null>;
}
declare function SomaFileBrowser({ files, loading, onSelect, readFile }: SomaFileBrowserProps): React.JSX.Element;

interface SomaFileViewerProps {
    content: string | null;
    fileName?: string;
    loading?: boolean;
    error?: string | null;
    onClose?: () => void;
}
declare function SomaFileViewer({ content, fileName, loading, error, onClose }: SomaFileViewerProps): React.JSX.Element;

interface SomaSkillEditorProps {
    skills: SomaSkill[];
    loading?: boolean;
    onCreate?: (name: string, content: string) => Promise<boolean>;
    onDelete?: (name: string) => Promise<void>;
}
declare function SomaSkillEditor({ skills, loading, onCreate, onDelete }: SomaSkillEditorProps): React.JSX.Element;

interface AgentSkillPanelProps {
    agentId: string;
    token: string;
    somaUrl?: string;
    onRefresh?: () => void;
}
declare function AgentSkillPanel({ agentId, token, somaUrl, onRefresh }: AgentSkillPanelProps): React.JSX.Element;

export { AgentSkillPanel as A, SomaChat as S, type SomaChatColors as a, type SomaChatMessage as b, type SomaChatProps as c, SomaConversationList as d, SomaCopilot as e, SomaFileBrowser as f, SomaFileViewer as g, SomaSkillEditor as h };
