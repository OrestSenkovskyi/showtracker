import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProgressBar from './ProgressBar'

describe('ProgressBar', () => {
  it('renders progress label with watched and total episodes', () => {
    render(<ProgressBar watched={5} total={10} />)
    
    expect(screen.getByText('5 / 10 episodes')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('calculates percentage correctly', () => {
    render(<ProgressBar watched={3} total={12} />)
    
    expect(screen.getByText('25%')).toBeInTheDocument()
  })

  it('handles zero total episodes', () => {
    render(<ProgressBar watched={0} total={0} />)
    
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('rounds percentage to nearest integer', () => {
    render(<ProgressBar watched={1} total={3} />)
    
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('hides label when showLabel is false', () => {
    render(<ProgressBar watched={5} total={10} showLabel={false} />)
    
    expect(screen.queryByText('5 / 10 episodes')).not.toBeInTheDocument()
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('applies correct size class for sm', () => {
    const { container } = render(<ProgressBar watched={5} total={10} size="sm" />)
    
    const progressBars = container.querySelectorAll('.h-1\\.5')
    expect(progressBars.length).toBe(2) // outer and inner bar
  })

  it('applies correct size class for lg', () => {
    const { container } = render(<ProgressBar watched={5} total={10} size="lg" />)
    
    const progressBars = container.querySelectorAll('.h-3')
    expect(progressBars.length).toBe(2)
  })

  it('sets correct width style based on percentage', () => {
    const { container } = render(<ProgressBar watched={7} total={10} />)
    
    const innerBar = container.querySelector('.bg-primary-500')
    expect(innerBar).toHaveStyle({ width: '70%' })
  })
})
