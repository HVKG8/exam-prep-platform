function Logo({ size = 32 }) {
  return (
    <img
      src="/logo.png"
      alt="ExamPrep AI"
      width={size}
      height={size}
      style={{
        borderRadius: size * 0.25,
        objectFit: 'contain',
        verticalAlign: 'middle',
      }}
    />
  )
}

export default Logo