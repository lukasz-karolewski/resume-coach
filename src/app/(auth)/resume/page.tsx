import Link from "next/link";
import CreateResumeButton from "~/components/resume/create-resume-button";
import ResumeDate from "~/components/resume/resume-date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/server";

export default async function ResumePage() {
  const resumes = await api.resume.list.query(undefined);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">My Resumes</h1>
          <p className="text-sm text-muted-foreground">
            Keep a focused set of resume variants and open the one you want to
            refine.
          </p>
        </div>
        <CreateResumeButton />
      </div>

      {resumes.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <CardTitle>No resumes yet</CardTitle>
            <CardDescription>
              Create your first resume to start building tailored versions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CreateResumeButton
              buttonLabel="Create your first resume"
              buttonProps={{ variant: "default" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {resumes.map((resume) => {
            const linkedJob = resume.Job?.title || resume.Job?.company;

            return (
              <Card
                key={resume.id}
                className="group border-border/70 bg-card/95 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="space-y-4">
                  <div className="space-y-2">
                    <CardTitle className="line-clamp-2 text-xl">
                      <Link
                        href={`/resume/${resume.id}`}
                        className="transition-colors hover:text-primary"
                      >
                        {resume.name}
                      </Link>
                    </CardTitle>
                    {linkedJob ? (
                      <CardDescription className="line-clamp-1">
                        {linkedJob}
                      </CardDescription>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Experience
                      </p>
                      <p className="mt-1 font-medium">
                        {resume._count.experience} roles
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/60 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Education
                      </p>
                      <p className="mt-1 font-medium">
                        {resume._count.education} entries
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground/80">
                    <ResumeDate label="Updated" value={resume.updatedAt} />
                    <ResumeDate label="Created" value={resume.createdAt} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
