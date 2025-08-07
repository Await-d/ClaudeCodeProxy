import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/test/utils'
import AccountModal from '../AccountModal'
import type { Account } from '@/services/api'

// Mock the API service
vi.mock('@/services/api', () => ({
  apiService: {
    createClaudeAccount: vi.fn(),
    updateClaudeAccount: vi.fn(),
    createGeminiAccount: vi.fn(),
    updateGeminiAccount: vi.fn(),
    createAccount: vi.fn(),
    updateAccount: vi.fn(),
    createClaudeConsoleAccount: vi.fn(),
    updateClaudeConsoleAccount: vi.fn(),
  }
}))

// Mock other dependencies
vi.mock('@/utils/toast', () => ({
  showToast: vi.fn()
}))

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    showConfirmModal: false,
    confirmOptions: {},
    showConfirm: vi.fn(),
    handleConfirm: vi.fn(),
    handleCancel: vi.fn()
  })
}))

describe('AccountModal', () => {
  const mockAccount: Account = {
    id: '1',
    name: 'Test Account',
    platform: 'claude',
    description: 'Test Description',
    accountType: 'shared',
    priority: 50,
    isEnabled: true,
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01'
  }

  const defaultProps = {
    show: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    account: null as Account | null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form correctly', () => {
      render(<AccountModal {...defaultProps} />)

      expect(screen.getByText('添加账户')).toBeInTheDocument()
      expect(screen.getByText('账户名称')).toBeInTheDocument()
      expect(screen.getByText('平台')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} />)

      // Try to proceed without filling required fields
      const nextButton = screen.getByRole('button', { name: /下一步|创建账户/ })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('请填写账户名称')).toBeInTheDocument()
      })
    })

    it('should fill form and proceed to next step', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} />)

      // Fill account name
      const nameInput = screen.getByPlaceholderText('为账户设置一个易识别的名称')
      await user.type(nameInput, 'Test Account')

      // Select Claude platform
      const claudeRadio = screen.getByLabelText('Claude')
      await user.click(claudeRadio)

      // Click next
      const nextButton = screen.getByRole('button', { name: /下一步/ })
      await user.click(nextButton)

      // Should not show validation error
      expect(screen.queryByText('请填写账户名称')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const editProps = {
      ...defaultProps,
      account: mockAccount,
    }

    it('should render edit form with existing data', () => {
      render(<AccountModal {...editProps} />)

      expect(screen.getByText('编辑账户')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument()
    })

    it('should show platform-specific configurations', () => {
      render(<AccountModal {...editProps} />)

      // Should show Claude-specific priority setting
      expect(screen.getByText('调度优先级')).toBeInTheDocument()
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

    it('should not render when show is false', () => {
      render(<AccountModal {...defaultProps} show={false} />)

      expect(screen.queryByText('添加账户')).not.toBeInTheDocument()
      expect(screen.queryByText('编辑账户')).not.toBeInTheDocument()
    })
  })

  describe('Platform Selection', () => {
    it('should show different platforms', () => {
      render(<AccountModal {...defaultProps} />)

      expect(screen.getByLabelText('Claude')).toBeInTheDocument()
      expect(screen.getByLabelText('Claude Console')).toBeInTheDocument()
      expect(screen.getByLabelText('Gemini')).toBeInTheDocument()
      expect(screen.getByLabelText('OpenAI')).toBeInTheDocument()
      expect(screen.getByLabelText('Thor')).toBeInTheDocument()
    })

    it('should show OAuth and manual options for supported platforms', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} />)

      // Select Claude (supports OAuth)
      const claudeRadio = screen.getByLabelText('Claude')
      await user.click(claudeRadio)

      expect(screen.getByLabelText('OAuth 授权 (推荐)')).toBeInTheDocument()
      expect(screen.getByLabelText('手动输入 Access Token')).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should validate account name is required', async () => {
      const user = userEvent.setup()
      render(<AccountModal {...defaultProps} />)

      // Select platform but leave name empty
      const claudeRadio = screen.getByLabelText('Claude')
      await user.click(claudeRadio)

      // Try to proceed
      const nextButton = screen.getByRole('button', { name: /下一步/ })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('请填写账户名称')).toBeInTheDocument()
      })
    })
  })
})