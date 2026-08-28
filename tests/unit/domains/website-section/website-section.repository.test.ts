import { WebsiteSectionRepository } from '~/server/domains/website-section/website-section.repository'

describe('WebsiteSectionRepository', () => {
  const websiteSection = {
    id: 'section-123',
    websiteId: 'website-123',
    type: 'HOME',
    isEnabled: true,
    position: 0,
    content: { introText: '' },
    createdAt: new Date('2026-04-24T00:00:00.000Z'),
    updatedAt: new Date('2026-04-24T00:00:00.000Z'),
  }

  it('should create a website section', async () => {
    const create = jest.fn().mockResolvedValue(websiteSection)
    const repository = new WebsiteSectionRepository({
      websiteSection: { create },
    } as never)

    await expect(
      repository.create({
        websiteId: 'website-123',
        type: 'HOME',
        isEnabled: true,
        position: 0,
        content: { introText: '' },
      })
    ).resolves.toEqual(websiteSection)

    expect(create).toHaveBeenCalledWith({
      data: {
        websiteId: 'website-123',
        type: 'HOME',
        isEnabled: true,
        position: 0,
        content: { introText: '' },
      },
    })
  })

  it('should list sections for a website in position order', async () => {
    const findMany = jest.fn().mockResolvedValue([websiteSection])
    const repository = new WebsiteSectionRepository({
      websiteSection: { findMany },
    } as never)

    await expect(repository.findByWebsiteId('website-123')).resolves.toEqual([websiteSection])
    expect(findMany).toHaveBeenCalledWith({
      where: { websiteId: 'website-123' },
      orderBy: { position: 'asc' },
    })
  })

  it('should update a website section by id', async () => {
    const update = jest
      .fn()
      .mockResolvedValue({ ...websiteSection, content: { introText: 'Updated intro' } })
    const repository = new WebsiteSectionRepository({
      websiteSection: { update },
    } as never)

    await expect(
      repository.update('section-123', {
        content: { introText: 'Updated intro' },
      })
    ).resolves.toMatchObject({
      id: 'section-123',
      content: { introText: 'Updated intro' },
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: 'section-123' },
      data: { content: { introText: 'Updated intro' } },
    })
  })
})
