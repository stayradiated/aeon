import { createOpenAI } from '@ai-sdk/openai'
import { errorBoundary } from '@stayradiated/error-boundary'
import { generateText, stepCountIs, tool } from 'ai'
import { z } from 'zod'

import { getOpenAIApiKey } from '#lib/server/env.js'

type SlackStatus = {
  status: string
  emoji: string
  messageLog: {
    system: string
    prompt: string
    steps: unknown
  }
}

const SYSTEM = `
Set the users Slack status, based on their current activity.
Return your result ONLY by calling the tool "setSlackStatus".
`.trim()

const setSlackStatus = tool({
  description: 'Set the Slack status',
  inputSchema: z.object({
    status: z.string().describe('The description of my current status'),
    emoji: z.string().describe('A single emoji'),
  }),
})

type GenerateStatusOptions = {
  currentStatus: string
}

const generateStatus = async (
  options: GenerateStatusOptions,
): Promise<SlackStatus | Error> => {
  const { currentStatus } = options
  return errorBoundary(async () => {
    const openai = createOpenAI({
      apiKey: getOpenAIApiKey(),
    })

    const result = await generateText({
      model: openai('gpt-5-nano'),
      system: SYSTEM,
      prompt: currentStatus,
      tools: { setSlackStatus },
      toolChoice: { type: 'tool', toolName: 'setSlackStatus' },
      stopWhen: stepCountIs(1),
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
          textVerbosity: 'low',
        },
      },
    })

    const toolCall = result.toolCalls.at(0)
    if (!toolCall) {
      return new Error('No tool result')
    }
    if (toolCall.toolName !== 'setSlackStatus') {
      return new Error('Unexpected tool result')
    }

    const messageLog = {
      system: SYSTEM,
      prompt: currentStatus,
      steps: result.steps.flatMap((step) => step.content),
    }

    const { status, emoji } = toolCall.input as SlackStatus

    return { status, emoji, messageLog }
  })
}

export { generateStatus }
