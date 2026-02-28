import { ref } from 'vue'
import data from '../../../../generated/playground-data.json'

export interface TerminalLine {
  type: 'prompt' | 'output' | 'comment' | 'success' | 'heading'
  text: string
  delay: number
}

export interface CommandMeta {
  filesCreated: string[]
  agentsSpawned: string[]
  requiresReview: boolean
}

export interface PlaygroundCommand {
  name: string
  slug: string
  description: string
  phase: string | null
  terminalLines: TerminalLine[]
  meta: CommandMeta
}

export interface PersonaItem {
  slug: string
  name: string
  summary: string
  link: string
}

export interface TeamMember {
  name: string
  compose: Record<string, string | null>
  layers: string[]
}

export interface TeamTask {
  id: string
  name: string
  member: string
  output: string | null
  dependsOn: string | string[] | null
  planApproval: boolean
}

export interface TeamDependency {
  from: string
  to: string
  label: string
}

export interface TeamCoordination {
  between: string[]
  topic: string
}

export interface PlaygroundTeam {
  slug: string
  name: string
  phase: string
  phaseCode: string | null
  members: TeamMember[]
  tasks: TeamTask[]
  dependencies: TeamDependency[]
  coordination: TeamCoordination[]
  reviewGate: { mode: string; checklist: string } | null
  link: string
}

export interface PlaygroundData {
  commands: PlaygroundCommand[]
  personas: Record<string, PersonaItem[]>
  teams: PlaygroundTeam[]
  spawnTemplate: string
}

export function usePlaygroundData() {
  return data as PlaygroundData
}
