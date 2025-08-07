import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, mockFetch, mockFetchError, mockAccount, testIds } from '@/test/utils'
import AccountModal from '../AccountModal'

// Mock the API service
vi.mock('@/services/api', () => ({
  createAccount: vi.fn(),
  updateAccount: vi.fn(),
}))

describe('AccountModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    mode: 'create' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form correctly', () => {
      render(<AccountModal {...defaultProps} mode="create" />)

      expect(screen.getByText('创建账户')).toBeInTheDocument()
      expect(screen.getByLabelText('账户ID')).toBeInTheDocument()
      expect(screen.getByLabelText('平台类型')).toBeInTheDocument()
      expect(screen.getByLabelText('分组名称')).toBeInTheDocument()
      expect(screen.getByLabelText('优先级')).toBeInTheDocument()
      expect(screen.getByLabelText('权重')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '创建' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      const createButton = screen.getByRole('button', { name: '创建' })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('请输入账户ID')).toBeInTheDocument()
        expect(screen.getByText('请选择平台类型')).toBeInTheDocument()
        expect(screen.getByText('请输入分组名称')).toBeInTheDocument()
      })
    })

    it('should create account successfully', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const onClose = vi.fn()

      // Mock successful API response
      mockFetch({ ...mockAccount, id: 'new-account-id' }, true, 201)

      render(
        <AccountModal 
          {...defaultProps} 
          mode="create" 
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )

      // 填写表单
      await user.type(screen.getByLabelText('账户ID'), 'new-account-id')
      await user.selectOptions(screen.getByLabelText('平台类型'), 'claude')
      await user.type(screen.getByLabelText('分组名称'), 'premium')
      await user.clear(screen.getByLabelText('优先级'))
      await user.type(screen.getByLabelText('优先级'), '1')
      await user.clear(screen.getByLabelText('权重'))
      await user.type(screen.getByLabelText('权重'), '100')

      // 提交表单
      const createButton = screen.getByRole('button', { name: '创建' })
      await user.click(createButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          ...mockAccount,
          id: 'new-account-id'
        })
        expect(onClose).toHaveBeenCalled()
      })
    })

    it('should handle create error', async () => {
      const user = userEvent.setup()
      
      // Mock error response
      mockFetchError(400, '账户ID已存在')

      render(<AccountModal {...defaultProps} mode="create" />)

      // 填写必填字段
      await user.type(screen.getByLabelText('账户ID'), 'existing-id')
      await user.selectOptions(screen.getByLabelText('平台类型'), 'claude')
      await user.type(screen.getByLabelText('分组名称'), 'premium')

      // 提交表单
      const createButton = screen.getByRole('button', { name: '创建' })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('账户ID已存在')).toBeInTheDocument()
      })
    })
  })

  describe('Edit Mode', () => {
    const editProps = {
      ...defaultProps,
      mode: 'edit' as const,
      account: mockAccount,
    }

    it('should render edit form with existing data', () => {
      render(<AccountModal {...editProps} />)

      expect(screen.getByText('编辑账户')).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockAccount.id)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockAccount.platform)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockAccount.poolGroup)).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockAccount.priority.toString())).toBeInTheDocument()
      expect(screen.getByDisplayValue(mockAccount.weight.toString())).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument()
    })

    it('should disable account ID field in edit mode', () => {
      render(<AccountModal {...editProps} />)

      const accountIdInput = screen.getByLabelText('账户ID')
      expect(accountIdInput).toBeDisabled()
    })

    it('should update account successfully', async () => {
      const user = userEvent.setup()
      const onSuccess = vi.fn()
      const onClose = vi.fn()

      // Mock successful update response
      mockFetch({ ...mockAccount, poolGroup: 'updated-group' })

      render(
        <AccountModal 
          {...editProps} 
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )

      // 修改分组名称
      const poolGroupInput = screen.getByLabelText('分组名称')
      await user.clear(poolGroupInput)
      await user.type(poolGroupInput, 'updated-group')

      // 提交表单
      const saveButton = screen.getByRole('button', { name: '保存' })
      await user.click(saveButton)

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          ...mockAccount,
          poolGroup: 'updated-group'
        })
        expect(onClose).toHaveBeenCalled()
      })
    })
  })

  describe('Form Validation', () => {
    it('should validate priority range', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      const priorityInput = screen.getByLabelText('优先级')
      
      // 测试负数
      await user.type(priorityInput, '-1')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('优先级必须大于0')).toBeInTheDocument()
      })

      // 清除并测试过大的值
      await user.clear(priorityInput)
      await user.type(priorityInput, '1001')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('优先级不能超过1000')).toBeInTheDocument()
      })
    })

    it('should validate weight range', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      const weightInput = screen.getByLabelText('权重')
      
      // 测试负数
      await user.type(weightInput, '-1')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('权重必须大于0')).toBeInTheDocument()
      })

      // 清除并测试过大的值
      await user.clear(weightInput)
      await user.type(weightInput, '101')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('权重不能超过100')).toBeInTheDocument()
      })
    })

    it('should validate account ID format', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      const accountIdInput = screen.getByLabelText('账户ID')
      
      // 测试过短的ID
      await user.type(accountIdInput, 'abc')
      await user.tab()
      
      await waitFor(() => {
        expect(screen.getByText('账户ID长度必须在4-50个字符之间')).toBeInTheDocument()
      })

      // 测试包含特殊字符
      await user.clear(accountIdInput)
      await user.type(accountIdInput, 'invalid@id#')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('账户ID只能包含字母、数字、连字符和下划线')).toBeInTheDocument()
      })
    })
  })

  describe('Platform-specific validation', () => {
    it('should show Claude-specific fields', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      await user.selectOptions(screen.getByLabelText('平台类型'), 'claude')

      await waitFor(() => {
        expect(screen.getByLabelText('Session Key')).toBeInTheDocument()
        expect(screen.getByLabelText('Organization ID')).toBeInTheDocument()
      })
    })

    it('should show OpenAI-specific fields', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      await user.selectOptions(screen.getByLabelText('平台类型'), 'openai')

      await waitFor(() => {
        expect(screen.getByLabelText('API Key')).toBeInTheDocument()
        expect(screen.getByLabelText('Organization ID')).toBeInTheDocument()
      })
    })

    it('should show Gemini-specific fields', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      await user.selectOptions(screen.getByLabelText('平台类型'), 'gemini')

      await waitFor(() => {
        expect(screen.getByLabelText('API Key')).toBeInTheDocument()
        expect(screen.getByLabelText('Project ID')).toBeInTheDocument()
      })
    })
  })

  describe('Modal Controls', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<AccountModal {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByRole('button', { name: '取消' })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<AccountModal {...defaultProps} onClose={onClose} />)

      // 点击模态框背景
      const backdrop = screen.getByRole('dialog').parentElement
      if (backdrop) {
        await user.click(backdrop)
        expect(onClose).toHaveBeenCalled()
      }
    })

    it('should not render when isOpen is false', () => {
      render(<AccountModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('创建账户')).not.toBeInTheDocument()
      expect(screen.queryByText('编辑账户')).not.toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup()

      // Mock delayed response
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve(mockAccount)
          }), 100)
        )
      )

      render(<AccountModal {...defaultProps} mode="create" />)

      // 填写表单
      await user.type(screen.getByLabelText('账户ID'), 'test-account')
      await user.selectOptions(screen.getByLabelText('平台类型'), 'claude')
      await user.type(screen.getByLabelText('分组名称'), 'premium')

      // 提交表单
      const createButton = screen.getByRole('button', { name: '创建' })
      await user.click(createButton)

      // 检查加载状态
      expect(screen.getByRole('button', { name: '创建中...' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '创建中...' })).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AccountModal {...defaultProps} mode="create" />)

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby')
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('should focus first input when modal opens', async () => {
      render(<AccountModal {...defaultProps} mode="create" />)

      await waitFor(() => {
        expect(screen.getByLabelText('账户ID')).toHaveFocus()
      })
    })

    it('should trap focus within modal', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} mode="create" />)

      // Tab through all focusable elements
      await user.tab() // Platform select
      await user.tab() // Pool group input
      await user.tab() // Priority input
      await user.tab() // Weight input
      await user.tab() // Enable checkbox
      await user.tab() // Create button
      await user.tab() // Cancel button
      await user.tab() // Should wrap back to first input

      await waitFor(() => {
        expect(screen.getByLabelText('账户ID')).toHaveFocus()
      })
    })
  })
})