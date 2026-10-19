import { WebsiteRepository } from '~/server/domains/website/website.repository'

describe('WebsiteRepository.findRsvpAccessBySubUrl', () => {
  it('selects only the wedding id and RSVP flag for the subUrl', async () => {
    const findFirst = jest.fn().mockResolvedValue({ weddingId: 'w1', isRsvpEnabled: true })
    const repository = new WebsiteRepository({ website: { findFirst } } as never)

    await expect(repository.findRsvpAccessBySubUrl('ash')).resolves.toEqual({
      weddingId: 'w1',
      isRsvpEnabled: true,
    })
    expect(findFirst).toHaveBeenCalledWith({
      where: { subUrl: 'ash' },
      select: { weddingId: true, isRsvpEnabled: true },
    })
  })
})
