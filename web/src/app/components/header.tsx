export default function Header({ title }: { title: string }) {
  return (
    <h2 className={`text-2xl font-semibold border-b-2 border-b-gray-300`}>
      {title}
    </h2>
  );
}
