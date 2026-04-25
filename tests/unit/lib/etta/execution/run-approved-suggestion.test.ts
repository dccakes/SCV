/**
 * @jest-environment node
 */

import { runEttaAgent } from '~/lib/etta/agent'
import {
  ETTA_EXECUTION_FAILURE_MESSAGE,
  runApprovedSuggestion,
} from '~/lib/etta/execution/run-approved-suggestion'
import { db } from '~/server/db'

jest.mock('~/lib/etta/agent', () => ({
  runEttaAgent: jest.fn(),
}))

jest.mock('~/server/db', () => ({
  db: {
    ettaSuggestion: {
      updateMany: jest.fn(),
    },
  },
}))

const mockRunEttaAgent = runEttaAgent as jest.Mock
const mockUpdateMany = db.ettaSuggestion.updateMany as jest.Mock

const baseSuggestion = {
  id: 'suggestion-1',
  weddingId: 'wedding-1',
  actorId: 'actor-1',
  status: 'approved',
  summary: 'Add Sunset Florals to vendors',
  actionType: 'add_vendor',
  domain: 'vendors',
  payload: {
    name: 'Sunset Florals',
    category: 'FLOWERS',
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdateMany.mockImplementation(async ({ where, data }) => ({
    ...baseSuggestion,
    ...data,
    id: where.id,
    count: 1,
  }))
  mockRunEttaAgent.mockResolvedValue({
    text: Promise.resolve('Vendor added successfully'),
    steps: Promise.resolve([
      {
        toolResults: [{ toolName: 'add_vendor' }],
      },
    ]),
  })
})

describe('runApprovedSuggestion', () => {
  it('marks the suggestion actioned after successful execution', async () => {
    await runApprovedSuggestion({
      suggestion: baseSuggestion,
      authz: { userId: 'user-1', activeOrganization: null },
    })

    expect(mockRunEttaAgent).toHaveBeenCalledWith({
      actor: 'couple-background',
      weddingId: 'wedding-1',
      authz: { userId: 'user-1', activeOrganization: null },
      toolsetMode: 'background-execution',
      approvedSuggestionActionType: 'add_vendor',
      messages: [
        {
          role: 'user',
          content: expect.stringContaining('Execute approved suggestion suggestion-1'),
        },
      ],
    })
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'suggestion-1', status: 'approved' },
      data: expect.objectContaining({
        status: 'actioned',
        failureReason: null,
        executedAt: expect.any(Date),
      }),
    })
  })

  it('marks the suggestion failed and stores the error when execution throws', async () => {
    mockRunEttaAgent.mockRejectedValue(new Error('Vendor service rejected the payload'))

    await runApprovedSuggestion({
      suggestion: baseSuggestion,
      authz: { userId: 'user-1', activeOrganization: null },
    })

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'suggestion-1', status: 'approved' },
      data: {
        status: 'failed',
        failureReason: ETTA_EXECUTION_FAILURE_MESSAGE,
      },
    })
  })

  it('marks the suggestion failed when no tool executes', async () => {
    mockRunEttaAgent.mockResolvedValue({
      text: Promise.resolve('I could not do that'),
      steps: Promise.resolve([{ toolResults: [] }]),
    })

    await runApprovedSuggestion({
      suggestion: baseSuggestion,
      authz: { userId: 'user-1', activeOrganization: null },
    })

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'suggestion-1', status: 'approved' },
      data: {
        status: 'failed',
        failureReason: ETTA_EXECUTION_FAILURE_MESSAGE,
      },
    })
  })

  it('does not overwrite a suggestion that is no longer approved when the run finishes', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 })

    await runApprovedSuggestion({
      suggestion: baseSuggestion,
      authz: { userId: 'user-1', activeOrganization: null },
    })

    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: 'suggestion-1', status: 'approved' },
      data: expect.objectContaining({
        status: 'actioned',
      }),
    })
  })
})
