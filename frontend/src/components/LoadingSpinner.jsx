const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizes = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-2 border-bg-border border-t-amber-500`}
      />
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg-base">
    <div className="text-center space-y-4">
      <div className="text-3xl font-display font-bold text-amber-500">Felicity</div>
      <LoadingSpinner size="lg" />
    </div>
  </div>
);

export default LoadingSpinner;
