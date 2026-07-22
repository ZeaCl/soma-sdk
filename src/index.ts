// Hooks
export { useSoma } from './hooks/useSoma'
export { useSomaConversations, useSomaFiles, useSomaFileContent, useSomaSkills, useSomaAgents } from './hooks/api'

// Components
export { SomaChat } from './components/SomaChat'
export type { SomaChatProps, SomaChatColors, SomaChatMessage } from './components/SomaChat'
export { SomaCopilot } from './components/SomaCopilot'
export { SomaConversationList } from './components/SomaConversationList'
export { SomaFileBrowser } from './components/SomaFileBrowser'
export { SomaFileViewer } from './components/SomaFileViewer'
export { SomaSkillEditor } from './components/SomaSkillEditor'
export { AgentSkillPanel } from './components/AgentSkillPanel'
export { SomaPanel } from './components/SomaPanel'
export { SkillManager } from './components/SkillManager'
export { UserWorkspace } from './components/UserWorkspace'
export type { UserWorkspaceProps, UserWorkspaceColors, WorkspaceFile } from './components/UserWorkspace'
export { useUserWorkspace } from './components/UserWorkspace'
export { UserFileDropZone } from './components/UserFileDropZone'
export type { UserFileDropZoneProps } from './components/UserFileDropZone'

// Sandbox providers
export { createRestSandboxProvider } from './sandbox/rest-provider'
export { createMemorySandboxProvider } from './sandbox/memory-provider'
export type { SandboxProvider, SandboxFile } from './sandbox/types'

// Types
export type {
  SomaMessage,
  SomaConversation,
  SomaFile,
  SomaSkill,
  SomaAgent,
  SomaStreamEvent,
  UseSomaOptions,
  UseSomaReturn,
} from './types'
