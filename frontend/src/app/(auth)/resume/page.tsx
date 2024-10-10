export default async function ResumePage() {
  return (
    <div className="m-auto flex max-w-4xl flex-col gap-4 bg-white p-12 shadow-lg dark:bg-gray-800 print:p-0 print:shadow-none">
      List of Resumes:
      <ul>
        <li>
          <a href="/resume/base">base</a>
        </li>
        <li>
          <a href="/resume/Salesforce">Salesforce</a>
        </li>
      </ul>
    </div>
  );
}
