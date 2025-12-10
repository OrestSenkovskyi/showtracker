import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ShowCard from './ShowCard'

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('ShowCard', () => {
  const defaultProps = {
    id: 1,
    title: 'Breaking Bad',
    posterPath: '/path/to/poster.jpg',
  }

  it('renders show title', () => {
    renderWithRouter(<ShowCard {...defaultProps} />)
    
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument()
  })

  it('renders poster image with TMDB URL', () => {
    renderWithRouter(<ShowCard {...defaultProps} />)
    
    const img = screen.getByAltText('Breaking Bad')
    expect(img).toHaveAttribute('src', 'https://image.tmdb.org/t/p/w300/path/to/poster.jpg')
  })

  it('renders placeholder image when posterPath is null', () => {
    renderWithRouter(<ShowCard {...defaultProps} posterPath={null} />)
    
    const img = screen.getByAltText('Breaking Bad')
    expect(img).toHaveAttribute('src', 'https://via.placeholder.com/300x450?text=No+Image')
  })

  it('renders rating when provided', () => {
    renderWithRouter(<ShowCard {...defaultProps} rating={8.5} />)
    
    expect(screen.getByText('⭐ 8.5')).toBeInTheDocument()
  })

  it('does not render rating when null', () => {
    renderWithRouter(<ShowCard {...defaultProps} rating={null} />)
    
    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument()
  })

  it('renders year when provided', () => {
    renderWithRouter(<ShowCard {...defaultProps} year="2008" />)
    
    expect(screen.getByText('2008')).toBeInTheDocument()
  })

  it('links to show detail page', () => {
    renderWithRouter(<ShowCard {...defaultProps} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/show/1')
  })

  it('renders Add button when onAdd is provided', () => {
    renderWithRouter(<ShowCard {...defaultProps} onAdd={vi.fn()} />)
    
    expect(screen.getByText('+ Add')).toBeInTheDocument()
  })

  it('renders Remove button when onRemove is provided', () => {
    renderWithRouter(<ShowCard {...defaultProps} onRemove={vi.fn()} />)
    
    expect(screen.getByText('Remove')).toBeInTheDocument()
  })

  it('calls onAdd when Add button is clicked', () => {
    const onAdd = vi.fn()
    renderWithRouter(<ShowCard {...defaultProps} onAdd={onAdd} />)
    
    fireEvent.click(screen.getByText('+ Add'))
    
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onRemove when Remove button is clicked', () => {
    const onRemove = vi.fn()
    renderWithRouter(<ShowCard {...defaultProps} onRemove={onRemove} />)
    
    fireEvent.click(screen.getByText('Remove'))
    
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('hides action buttons when showActions is false', () => {
    renderWithRouter(<ShowCard {...defaultProps} onAdd={vi.fn()} showActions={false} />)
    
    expect(screen.queryByText('+ Add')).not.toBeInTheDocument()
  })

  it('renders progress bar when progress is provided', () => {
    const progress = { watched: 5, total: 10, percentage: 50 }
    renderWithRouter(<ShowCard {...defaultProps} progress={progress} />)
    
    expect(screen.getByText('5/10')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
