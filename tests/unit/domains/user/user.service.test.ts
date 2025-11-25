/**
 * Tests for User Domain Service
 */

import { TRPCError } from '@trpc/server'

import { UserService } from '~/server/domains/user/user.service'
import { type UserRepository } from '~/server/domains/user/user.repository'
import { type User } from '~/server/domains/user/user.types'

// Mock user data
const mockUser: User = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john@example.com',
  emailVerified: true,
  image: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  websiteUrl: 'https://example.com/wedding',
  groomFirstName: 'John',
  groomLastName: 'Doe',
  brideFirstName: 'Jane',
  brideLastName: 'Doe',
}

// Mock repository
const createMockRepository = (): jest.Mocked<UserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  exists: jest.fn(),
})

describe('UserService', () => {
  let userService: UserService
  let mockRepository: jest.Mocked<UserRepository>

  beforeEach(() => {
    mockRepository = createMockRepository()
    userService = new UserService(mockRepository)
  })

  describe('getCurrentUser', () => {
    it('should return null when userId is null', async () => {
      const result = await userService.getCurrentUser(null)
      expect(result).toBeNull()
      expect(mockRepository.findById).not.toHaveBeenCalled()
    })

    it('should return user when userId is valid', async () => {
      mockRepository.findById.mockResolvedValue(mockUser)

      const result = await userService.getCurrentUser('user-123')

      expect(result).toEqual(mockUser)
      expect(mockRepository.findById).toHaveBeenCalledWith('user-123')
    })

    it('should return null when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await userService.getCurrentUser('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getById', () => {
    it('should return user when user accesses their own data', async () => {
      mockRepository.findById.mockResolvedValue(mockUser)

      const result = await userService.getById('user-123', 'user-123')

      expect(result).toEqual(mockUser)
    })

    it('should throw FORBIDDEN when user tries to access another user', async () => {
      await expect(userService.getById('user-123', 'other-user')).rejects.toThrow(TRPCError)

      try {
        await userService.getById('user-123', 'other-user')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
      }
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      await expect(userService.getById('user-123', 'user-123')).rejects.toThrow(TRPCError)

      try {
        await userService.getById('user-123', 'user-123')
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }
    })
  })

  describe('updateProfile', () => {
    it('should update user profile when user updates their own profile', async () => {
      const updatedUser = { ...mockUser, groomFirstName: 'Johnny' }
      mockRepository.exists.mockResolvedValue(true)
      mockRepository.update.mockResolvedValue(updatedUser)

      const result = await userService.updateProfile('user-123', 'user-123', {
        groomFirstName: 'Johnny',
      })

      expect(result.groomFirstName).toBe('Johnny')
      expect(mockRepository.update).toHaveBeenCalledWith('user-123', { groomFirstName: 'Johnny' })
    })

    it('should throw FORBIDDEN when user tries to update another user', async () => {
      await expect(
        userService.updateProfile('user-123', 'other-user', { name: 'Test' })
      ).rejects.toThrow(TRPCError)

      try {
        await userService.updateProfile('user-123', 'other-user', { name: 'Test' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('FORBIDDEN')
      }
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false)

      await expect(
        userService.updateProfile('user-123', 'user-123', { name: 'Test' })
      ).rejects.toThrow(TRPCError)

      try {
        await userService.updateProfile('user-123', 'user-123', { name: 'Test' })
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError)
        expect((error as TRPCError).code).toBe('NOT_FOUND')
      }
    })
  })

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockRepository.exists.mockResolvedValue(true)

      const result = await userService.exists('user-123')

      expect(result).toBe(true)
    })

    it('should return false when user does not exist', async () => {
      mockRepository.exists.mockResolvedValue(false)

      const result = await userService.exists('nonexistent')

      expect(result).toBe(false)
    })
  })
})
