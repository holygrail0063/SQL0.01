import { VerifyEmailPanel } from "@/components/VerifyEmailPanel";

type VerifyEmailSearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VerifyEmailPage({ searchParams }: { searchParams: VerifyEmailSearchParams }) {
  const params = await searchParams;
  const email = firstParam(params.email);
  const nextPath = firstParam(params.next);

  return (
    <VerifyEmailPanel
      initialEmail={email ?? ""}
      nextPath={nextPath}
      state={firstParam(params.required) === "1" ? "required" : "pending"}
    />
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
