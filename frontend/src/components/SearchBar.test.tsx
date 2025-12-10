import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

describe('SearchBar', () => {
  it('renders with default placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} />)
    
    expect(screen.getByPlaceholderText('Search TV shows...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(<SearchBar onSearch={vi.fn()} placeholder="Find something..." />)
    
    expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument()
  })

  it('calls onSearch with query on form submit', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    
    render(<SearchBar onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('Search TV shows...')
    await user.type(input, 'Breaking Bad')
    await user.keyboard('{Enter}')
    
    expect(onSearch).toHaveBeenCalledWith('Breaking Bad')
  })

  it('trims whitespace from query', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    
    render(<SearchBar onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('Search TV shows...')
    await user.type(input, '  Game of Thrones  ')
    await user.keyboard('{Enter}')
    
    expect(onSearch).toHaveBeenCalledWith('Game of Thrones')
  })

  it('does not call onSearch for empty query', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    
    render(<SearchBar onSearch={onSearch} />)
    
    const input = screen.getByPlaceholderText('Search TV shows...')
    await user.type(input, '   ')
    await user.keyboard('{Enter}')
    
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('shows loading spinner when isLoading is true', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
    
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('hides loading spinner when isLoading is false', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} isLoading={false} />)
    
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('updates input value as user types', async () => {
    const user = userEvent.setup()
    
    render(<SearchBar onSearch={vi.fn()} />)
    
    const input = screen.getByPlaceholderText('Search TV shows...')
    await user.type(input, 'Stranger Things')
    
    expect(input).toHaveValue('Stranger Things')
  })
})
