export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2>Admin Panel</h2>
      <hr />
      <div>{children}</div>
    </div>
  );
}