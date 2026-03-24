function Footer() {
  const version = process.env.VERSION;

  return (
    <footer className="border-t bg-background/95 print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Resume Coach</p>
        <p>{version || "development"}</p>
      </div>
    </footer>
  );
}

export default Footer;
