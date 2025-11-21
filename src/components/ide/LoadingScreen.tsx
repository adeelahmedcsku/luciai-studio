export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <h2 className="text-xl font-semibold text-foreground">
          Software Developer Agent IDE
        </h2>
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    </div>
  );
}
