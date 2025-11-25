/**
 * Tests for User Domain Service
 */

import { TRPCError } from '@trpc/server'

// Must mock before importing the service
jest.mock('~/server/domains/user/user.repository')

// @ts-expect-error - Importing mock functions from mocked module
import { mockExists, mockFindById, mockUpdate, mockUser, resetMocks, UserRepository } from '~/server/domains/user/user.repository'
import { UserService } from '~/server/domains/user/user.service'

// Create typed aliases for mocked functions
const mockFindByIdFn = mockFindById as jest.Mock
const mockExistsFn = mockExists as jest.Mock
const mockUpdateFn = mockUpdate as jest.Mock

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    resetMocks()
    const mockRepository = new UserRepository({})
    userService = new UserService(mockRepository)
  })

  describe('getCurrentUser', () => {
    it('should return null when userId is null', async () => {
      const result = await userService.getCurrentUser(null)
      expect(result).toBeNull()
      expect(mockFindByIdFn).not.toHaveBeenCalled()
    })

    it('should return user when userId is valid', async () => {
      mockFindByIdFn.mockResolvedValue(mockUser)

      const result = await userService.getCurrentUser('user-123')

      expect(result).toEqual(mockUser)
      expect(mockFindByIdFn).toHaveBeenCalledWith('user-123')
    })

    it('should return null when user not found', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      const result = await userService.getCurrentUser('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getById', () => {
    it('should return user when user accesses their own data', async () => {
      mockFindByIdFn.mockResolvedValue(mockUser)

      const result = await userService.getById('user-123', 'user-123')

      expect(result).toEqual(mockUser)
    })

    it('should throw FORBIDDEN when user tries to access another user', async () => {
      await expect(userService.getById('user-123', 'other-user')).rejects.toThrow(TRPCError)
      await expect(userService.getById('user-123', 'other-user')).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockFindByIdFn.mockResolvedValue(null)

      await expect(userService.getById('user-123', 'user-123')).rejects.toThrow(TRPCError)
      await expect(userService.getById('user-123', 'user-123')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      })
    })
  })

  describe('updateProfile', () => {
    it('should update user profile when user updates their own profile', async () => {
      const updatedUser = { ...mockUser, groomFirstName: 'Johnny' }
      mockExistsFn.mockResolvedValue(true)
      mockUpdateFn.mockResolvedValue(updatedUser)

      const result = await userService.updateProfile('user-123', 'user-123', {
        groomFirstName: 'Johnny',
      })

      expect(result.groomFirstName).toBe('Johnny')
      expect(mockUpdateFn).toHaveBeenCalledWith('user-123', { groomFirstName: 'Johnny' })
    })

    it('should throw FORBIDDEN when user tries to update another user', async () => {
      await expect(
        userService.updateProfile('user-123', 'other-user', { name: 'Test' })
      ).rejects.toThrow(TRPCError)
      await expect(
        userService.updateProfile('user-123', 'other-user', { name: 'Test' })
      ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('should throw NOT_FOUND when user does not exist', async () => {
      mockExistsFn.mockResolvedValue(false)

      await expect(
        userService.updateProfile('user-123', 'user-123', { name: 'Test' })
      ).rejects.toThrow(TRPCError)
      await expect(
        userService.updateProfile('user-123', 'user-123', { name: 'Test' })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })

  describe('exists', () => {
    it('should return true when user exists', async () => {
      mockExistsFn.mockResolvedValue(true)

      const result = await userService.exists('user-123')

      expect(result).toBe(true)
    })

    it('should return false when user does not exist', async () => {
      mockExistsFn.mockResolvedValue(false)

      const result = await userService.exists('nonexistent')

      expect(result).toBe(false)
    })
  })
})
