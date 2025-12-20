interface TSvgPathWrapper {
  transform: string
  strokeColor: string
  children: React.ReactNode
}
const SvgPathWrapper = ({
  transform,
  strokeColor,
  children
}: TSvgPathWrapper) => {
  return (
    <g
      transform={transform}
      fillRule="evenodd"
      stroke={strokeColor}
      strokeWidth="0"
    >
      {children}
    </g>
  )
}

export default SvgPathWrapper
