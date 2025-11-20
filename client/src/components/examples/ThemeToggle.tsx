import ThemeToggle from "../ThemeToggle";

export default function ThemeToggleExample() {
  return (
    <div className="flex items-center justify-center gap-4 p-6 bg-background">
      <p className="text-sm text-muted-foreground">Toggle tema:</p>
      <ThemeToggle />
    </div>
  );
}
