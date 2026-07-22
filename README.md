# @zea.cl/soma-sdk

React SDK for ZEA Soma AgentHub — chat, files, skills, workspaces.

## Install

```bash
npm install @zea.cl/soma-sdk
```

## Quick Start

```tsx
import { SomaChat } from '@zea.cl/soma-sdk'
import '@zea.cl/soma-sdk/styles/base.css'

<SomaChat
  agentId="my-agent"
  apiKey="zs_live_..."
  baseUrl="https://soma.zea.cl"
/>
```

## Dev

```bash
npm install
npm run build   # tsup → dist/
npm test        # vitest
```
