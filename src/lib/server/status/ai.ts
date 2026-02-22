import { createOpenAI } from '@ai-sdk/openai'
import { errorBoundary } from '@stayradiated/error-boundary'
import { generateText, stepCountIs, tool } from 'ai'
import { z } from 'zod'

import { getOpenAIApiKey } from '#lib/server/env.js'

type SlackStatus = {
  status: string
  emoji: string // slack emoji, e.g. ":ramen:"
}

const SYSTEM = `
You write Slack statuses, based on the current user activity.

Return your result ONLY by calling the tool "setSlackStatus".
Do not output normal text.
`.trim()

const setSlackStatus = tool({
  description: 'Set my current Slack status.',
  inputSchema: z.object({
    status: z
      .string()
      .describe(
        'A short, single-line description of my current activity (10–20 words).',
      ),
    emoji: z.string().describe('A single emoji.'),
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
      model: openai('gpt-5-mini'),
      system: SYSTEM,
      prompt: currentStatus,
      tools: { setSlackStatus },
      toolChoice: { type: 'tool', toolName: 'setSlackStatus' },
      stopWhen: stepCountIs(1),
    })

    const toolCall = result.toolCalls.at(0)
    if (!toolCall) {
      return new Error('No tool result')
    }
    if (toolCall.toolName !== 'setSlackStatus') {
      return new Error('Unexpected tool result')
    }

    const { status, emoji } = toolCall.input as SlackStatus
    return { status, emoji }
  })
}

export { generateStatus }
