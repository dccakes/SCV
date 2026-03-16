import { QuestionRepository } from '~/server/domains/question/question.repository'

describe('QuestionRepository scope helpers', () => {
  const mockQuestionFindFirst = jest.fn()
  const mockOptionDeleteMany = jest.fn()
  const mockEventFindFirst = jest.fn()
  const mockWebsiteFindFirst = jest.fn()

  const mockDb = {
    question: {
      findFirst: mockQuestionFindFirst,
    },
    option: {
      deleteMany: mockOptionDeleteMany,
    },
    event: {
      findFirst: mockEventFindFirst,
    },
    website: {
      findFirst: mockWebsiteFindFirst,
    },
  }

  let repository: QuestionRepository

  beforeEach(() => {
    jest.resetAllMocks()
    repository = new QuestionRepository(mockDb as never)
  })

  it('checks question wedding scope through event/website ownership', async () => {
    mockQuestionFindFirst.mockResolvedValue({ id: 'question-1' })

    const result = await repository.belongsToWedding('question-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockQuestionFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'question-1',
        OR: [{ event: { weddingId: 'wedding-1' } }, { website: { weddingId: 'wedding-1' } }],
      },
      select: { id: true },
    })
  })

  it('scopes option deletions to the owning question', async () => {
    mockOptionDeleteMany.mockResolvedValue({ count: 2 })

    const result = await repository.deleteOptionsForQuestion('question-1', ['option-1', 'option-2'])

    expect(result).toEqual({ count: 2 })
    expect(mockOptionDeleteMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['option-1', 'option-2'] },
        questionId: 'question-1',
      },
    })
  })

  it('checks event ownership by wedding id', async () => {
    mockEventFindFirst.mockResolvedValue({ id: 'event-1' })

    const result = await repository.eventBelongsToWedding('event-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockEventFindFirst).toHaveBeenCalledWith({
      where: { id: 'event-1', weddingId: 'wedding-1' },
      select: { id: true },
    })
  })

  it('checks website ownership by wedding id', async () => {
    mockWebsiteFindFirst.mockResolvedValue({ id: 'website-1' })

    const result = await repository.websiteBelongsToWedding('website-1', 'wedding-1')

    expect(result).toBe(true)
    expect(mockWebsiteFindFirst).toHaveBeenCalledWith({
      where: { id: 'website-1', weddingId: 'wedding-1' },
      select: { id: true },
    })
  })
})
