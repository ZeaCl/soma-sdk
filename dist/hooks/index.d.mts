import { U as UseSomaOptions, f as UseSomaReturn, S as SomaAgent, a as SomaConversation, b as SomaFile, d as SomaSkill } from '../index-B9tVZyfw.mjs';

declare function useSoma(options: UseSomaOptions): UseSomaReturn;

declare function useSomaConversations(token: string, baseUrl?: string): {
    conversations: SomaConversation[];
    loading: boolean;
    refresh: () => Promise<void>;
};
declare function useSomaFiles(token: string, baseUrl?: string): {
    files: SomaFile[];
    loading: boolean;
    refresh: (subpath?: string) => Promise<void>;
    upload: (name: string, data: string, path?: string) => Promise<boolean>;
    mkdir: (path: string) => Promise<void>;
    remove: (path: string) => Promise<void>;
    rename: (path: string, newName: string) => Promise<void>;
};
declare function useSomaFileContent(token: string, baseUrl?: string): {
    content: string | null;
    loading: boolean;
    error: string | null;
    readFile: (path: string) => Promise<string | null>;
    clear: () => void;
};
declare function useSomaSkills(token: string, baseUrl?: string): {
    skills: SomaSkill[];
    loading: boolean;
    refresh: () => Promise<void>;
    create: (name: string, content: string) => Promise<boolean>;
    deleteSkill: (name: string) => Promise<void>;
    assignToAgents: (skillName: string, agentIds: string[]) => Promise<boolean>;
    getAgentSkills: (agentId: string) => Promise<string[]>;
    getContent: (skillName: string) => Promise<string | null>;
};
declare function useSomaAgents(token: string, baseUrl?: string): {
    agents: SomaAgent[];
    loading: boolean;
    refresh: () => Promise<void>;
    createAgent: (data: {
        name: string;
        email: string;
        password: string;
        skills?: string[];
        system_prompt?: string;
    }) => Promise<any>;
};

export { useSoma, useSomaAgents, useSomaConversations, useSomaFileContent, useSomaFiles, useSomaSkills };
