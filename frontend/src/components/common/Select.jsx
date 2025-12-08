export const Select = ({ children, className = '', ...props }) => {
  return (
    <select
      className={`px-4 py-2 rounded border border-gray-300 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};