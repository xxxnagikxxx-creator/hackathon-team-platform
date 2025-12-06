type ButtonProps = {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export const MainButton = ({children, onClick, className }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`main-button ${className || ''}`}
    >
      {children}
    </button>
  )
}