import { WeddingProvisioningService } from '~/server/application/wedding-provisioning/wedding-provisioning.service'
import { ValidationError } from '~/server/domains/shared/domain-error'

const mockWedding = { id: 'wedding-123' }

const names = {
  userId: 'user-123',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Smith',
}

const createDeps = () => {
  const calls: string[] = []
  const track =
    <T>(name: string, value: T) =>
    () => {
      calls.push(name)
      return Promise.resolve(value)
    }
  return {
    calls,
    weddingService: { createWedding: jest.fn(track('wedding', mockWedding)) },
    guestTagService: { seedInitialTags: jest.fn(track('tags', undefined)) },
    eventManagementService: { createEventSystem: jest.fn(track('event', { id: 'event-1' })) },
    checklistSeedingService: { ensureSeeded: jest.fn(track('checklist', {})) },
    provisionEtta: jest.fn(track('etta', undefined)),
  }
}

describe('WeddingProvisioningService', () => {
  let deps: ReturnType<typeof createDeps>
  let service: WeddingProvisioningService
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    deps = createDeps()
    service = new WeddingProvisioningService(deps as never)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => consoleErrorSpy.mockRestore())

  it('creates the wedding, seeds tags, and provisions Etta when no details are given', async () => {
    await expect(service.provisionWedding('user-123', names)).resolves.toBe(mockWedding)

    expect(deps.weddingService.createWedding).toHaveBeenCalledWith('user-123', names)
    expect(deps.guestTagService.seedInitialTags).toHaveBeenCalledWith('wedding-123', [
      { name: 'Family', color: '#3b82f6' },
      { name: 'MutualFriends', color: '#10b981' },
      { name: 'Coworkers', color: '#8b5cf6' },
      { name: 'Plus One', color: '#f59e0b' },
    ])
    expect(deps.eventManagementService.createEventSystem).not.toHaveBeenCalled()
    expect(deps.checklistSeedingService.ensureSeeded).not.toHaveBeenCalled()
    expect(deps.calls).toEqual(['wedding', 'tags', 'etta'])
  })

  it('creates the Ceremony event and seeds the checklist, in order, when details are given', async () => {
    const weddingDate = '2027-06-15T00:00:00.000Z'

    await service.provisionWedding('user-123', {
      ...names,
      hasWeddingDetails: true,
      weddingDate,
      weddingLocation: 'Beach Resort',
    })

    expect(deps.eventManagementService.createEventSystem).toHaveBeenCalledWith('wedding-123', {
      eventName: 'Ceremony',
      date: weddingDate,
      venue: 'Beach Resort',
      collectRsvp: false,
      allowTagAlongs: false,
    })
    expect(deps.checklistSeedingService.ensureSeeded).toHaveBeenCalledWith('wedding-123')
    expect(deps.calls).toEqual(['wedding', 'tags', 'event', 'checklist', 'etta'])
  })

  it('skips the event when details are flagged but neither date nor location is set', async () => {
    await service.provisionWedding('user-123', { ...names, hasWeddingDetails: true })

    expect(deps.eventManagementService.createEventSystem).not.toHaveBeenCalled()
  })

  it('keeps the wedding when checklist seeding fails, and logs it', async () => {
    deps.checklistSeedingService.ensureSeeded.mockRejectedValue(new Error('seed failed'))

    await expect(
      service.provisionWedding('user-123', {
        ...names,
        hasWeddingDetails: true,
        weddingDate: '2027-06-15T00:00:00.000Z',
      })
    ).resolves.toBe(mockWedding)

    const [line] = consoleErrorSpy.mock.calls[0] as [string]
    expect(JSON.parse(line)).toMatchObject({
      message: 'Checklist seeding failed on wedding create',
      component: 'checklist',
    })
  })

  it('does not fail creation when Etta provisioning fails', async () => {
    deps.provisionEtta.mockRejectedValue(new Error('etta down'))

    await expect(service.provisionWedding('user-123', names)).resolves.toBe(mockWedding)
  })

  it('stops before any provisioning when the wedding cannot be created', async () => {
    deps.weddingService.createWedding.mockRejectedValue(
      new ValidationError('User already has a wedding')
    )

    await expect(service.provisionWedding('user-123', names)).rejects.toBeInstanceOf(
      ValidationError
    )
    expect(deps.guestTagService.seedInitialTags).not.toHaveBeenCalled()
    expect(deps.provisionEtta).not.toHaveBeenCalled()
  })
})
