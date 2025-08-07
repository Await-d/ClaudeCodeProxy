import React from 'react'
import { render, type RenderOptions, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/contexts/ToastContext'

// Mock AuthContext for testing
const MockAuthContext = React.createContext<any>(null)

const MockAuthProvider: React.FC<{ children: React.ReactNode; value: any }> = ({ children, value }) => (
  <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
)

// Mock API响应数据
export const mockApiKeyPermission = {
  id: 'permission-1',
  apiKeyId: 'api-key-1',
  accountPoolGroup: 'premium',
  allowedPlatforms: ['claude', 'openai'],
  allowedAccountIds: ['acc-1', 'acc-2'],
  selectionStrategy: 'priority',
  priority: 10,
  isEnabled: true,
  effectiveFrom: null,
  effectiveTo: null,
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
}

export const mockAccount = {
  id: 'acc-1',
  platform: 'claude',
  poolGroup: 'premium',
  priority: 1,
  weight: 100,
  isEnabled: true,
  usageCount: 50,
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
}

export const mockApiKey = {
  id: 'api-key-1',
  name: 'Test API Key',
  key: 'sk-test-key',
  isEnabled: true,
  totalRequests: 1000,
  totalCost: 25.50,
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString()
}

// 测试用户数据
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com'
}

// 创建测试用的认证上下文
export const createMockAuthContext = (isAuthenticated = true, user = mockUser) => ({
  isAuthenticated,
  user,
  login: vi.fn(),
  logout: vi.fn(),
  loading: false,
  hasPermission: vi.fn().mockReturnValue(true),
  hasRole: vi.fn().mockReturnValue(true)
})

// 创建完整的测试渲染器
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue = createMockAuthContext(true)
  
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MockAuthProvider value={mockAuthValue}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </MockAuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// 创建带有自定义认证状态的渲染器
export const renderWithAuth = (
  ui: React.ReactElement,
  authState = { isAuthenticated: true, user: mockUser },
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const CustomAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mockAuthValue = createMockAuthContext(authState.isAuthenticated, authState.user)
    
    return (
      <BrowserRouter>
        <ThemeProvider>
          <MockAuthProvider value={mockAuthValue}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </MockAuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    )
  }

  return render(ui, { wrapper: CustomAuthProvider, ...options })
}

// 创建不带认证的渲染器（用于登录页面测试）
export const renderWithoutAuth = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const NoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )

  return render(ui, { wrapper: NoAuthProvider, ...options })
}

// Mock fetch 响应助手
export const mockFetch = (response: any, ok = true, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response))
  })
}

// 创建错误响应
export const mockFetchError = (status = 500, message = 'Internal Server Error') => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ message }),
    text: () => Promise.resolve(JSON.stringify({ message }))
  })
}

// 等待异步操作完成
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

// 模拟用户输入
export const mockUserInput = {
  type: (element: HTMLElement, text: string) => {
    fireEvent.change(element, { target: { value: text } })
  },
  
  click: (element: HTMLElement) => {
    fireEvent.click(element)
  },
  
  submit: (form: HTMLFormElement) => {
    fireEvent.submit(form)
  }
}

// 表单数据构建器
export class FormDataBuilder {
  private data: Record<string, any> = {}

  withField(name: string, value: any) {
    this.data[name] = value
    return this
  }

  build() {
    return this.data
  }

  static permissionForm() {
    return new FormDataBuilder()
      .withField('accountPoolGroup', 'premium')
      .withField('allowedPlatforms', ['claude'])
      .withField('selectionStrategy', 'priority')
      .withField('priority', 10)
      .withField('isEnabled', true)
  }

  static apiKeyForm() {
    return new FormDataBuilder()
      .withField('name', 'Test API Key')
      .withField('key', 'sk-test-key')
      .withField('isEnabled', true)
  }
}

// 测试 ID 生成器
export const testIds = {
  permissionForm: 'permission-form',
  permissionList: 'permission-list',
  permissionItem: (id: string) => `permission-item-${id}`,
  addButton: 'add-button',
  editButton: (id: string) => `edit-button-${id}`,
  deleteButton: (id: string) => `delete-button-${id}`,
  confirmButton: 'confirm-button',
  cancelButton: 'cancel-button',
  loadingSpinner: 'loading-spinner',
  errorMessage: 'error-message',
  successMessage: 'success-message'
}

// re-export everything
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { customRender as render }