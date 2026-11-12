import { WeddingRepository } from '~/server/domains/wedding/wedding.repository'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('WeddingRepository.create', () => {
  it('creates the wedding with its workspace and the creator as owner, in one write', async () => {
    const create = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: data.id }))
    const repository = new WeddingRepository({ wedding: { create } } as never)

    await repository.create({
      userId: 'user-1',
      groomFirstName: 'Sam',
      groomLastName: 'Rivera',
      brideFirstName: 'Alex',
      brideLastName: 'Chen',
      enabledAddOns: ['tasks'],
    })

    expect(create).toHaveBeenCalledTimes(1)
    const { data } = create.mock.calls[0][0]
    expect(data.id).toMatch(UUID)
    expect(data).toMatchObject({
      groomFirstName: 'Sam',
      brideFirstName: 'Alex',
      enabledAddOns: ['tasks'],
      userWeddings: { create: { userId: 'user-1', role: 'owner', isPrimary: true } },
      organization: {
        create: {
          name: 'Sam & Alex',
          slug: `wedding-${data.id}`,
          members: { create: { userId: 'user-1', role: 'owner' } },
        },
      },
    })
    expect(data.organization.create.id).toMatch(UUID)
    expect(data.organization.create.members.create.id).toMatch(UUID)
  })
})
