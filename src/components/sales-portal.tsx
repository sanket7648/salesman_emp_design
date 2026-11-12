import { useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  Smartphone,
  Upload,
  UsersRound,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Workspace = "salesperson" | "admin";
type SalesPage = "overview" | "owner-info" | "my-owners" | "commissions" | "payouts";
type AdminPage = "overview" | "salespeople" | "referrals" | "commission-review" | "payouts";
type Page = SalesPage | AdminPage;

type Salesperson = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  city: string;
  aadhaarFile: string;
};

const salesNavigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "owner-info", label: "Owner info", icon: FileText },
  { id: "my-owners", label: "My owners", icon: UsersRound },
  { id: "commissions", label: "Commissions", icon: CircleDollarSign },
  { id: "payouts", label: "Payout history", icon: WalletCards },
] as const;

const adminNavigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "salespeople", label: "Salespeople", icon: UsersRound },
  { id: "referrals", label: "All referrals", icon: ClipboardList },
  { id: "commission-review", label: "Commission review", icon: CircleDollarSign },
  { id: "payouts", label: "Payouts", icon: WalletCards },
] as const;

const pageCopy: Record<Page, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "OPERATIONS OVERVIEW", title: "Keep the team moving.", description: "A clear view of acquisition, approvals, and payout flow." },
  "owner-info": { eyebrow: "YOUR PROFILE", title: "Owner info", description: "Your salesperson profile and contact details." },
  "my-owners": { eyebrow: "OWNER RELATIONSHIPS", title: "Referral pipeline", description: "Every owner attributed through the Nestni sales team." },
  commissions: { eyebrow: "COMMISSIONS", title: "Commission review", description: "Review generated commissions before they become payable." },
  payouts: { eyebrow: "PAYOUTS", title: "Payout history", description: "Track manual UPI and NEFT payout processing." },
  salespeople: { eyebrow: "TEAM MANAGEMENT", title: "Salespeople", description: "Create and manage the people growing Nestni’s owner network." },
  referrals: { eyebrow: "OWNER RELATIONSHIPS", title: "Referral pipeline", description: "Every owner attributed through the Nestni sales team." },
  "commission-review": { eyebrow: "COMMISSIONS", title: "Commission review", description: "Review generated commissions before they become payable." },
};

const salesCards = [
  { label: "Referred owners", value: "0", note: "Across your pipeline", icon: UsersRound, tone: "neutral" },
  { label: "Pending commission", value: "₹0", note: "Awaiting approval", icon: CircleDollarSign, tone: "orange" },
  { label: "Approved commission", value: "₹0", note: "₹0 paid to date", icon: Banknote, tone: "blue" },
] as const;

const adminCards = [
  { label: "Salespeople", value: "0", note: "0 active today", icon: UsersRound, tone: "neutral" },
  { label: "Referred owners", value: "0", note: "0 registered", icon: ClipboardList, tone: "orange" },
  { label: "Commission generated", value: "₹0", note: "0 awaiting review", icon: CircleDollarSign, tone: "green" },
  { label: "Payouts processed", value: "₹0", note: "Manual payouts", icon: WalletCards, tone: "blue" },
] as const;

export function SalesPortal() {
  const [workspace, setWorkspace] = useState<Workspace>("salesperson");
  const [page, setPage] = useState<Page>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [mobile, setMobile] = useState("");
  const [numberVerified, setNumberVerified] = useState(false);
  const [aadhaarFile, setAadhaarFile] = useState("");
  const navigation = workspace === "admin" ? adminNavigation : salesNavigation;
  const currentPage = pageCopy[page];

  const filteredSalespeople = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return salespeople;
    return salespeople.filter((person) =>
      [person.name, person.email, person.mobile, person.city].some((value) => value.toLowerCase().includes(query)),
    );
  }, [salespeople, searchValue]);

  function selectWorkspace(next: Workspace) {
    setWorkspace(next);
    setPage("overview");
    setSearchValue("");
  }

  function closeDialog(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setMobile("");
      setNumberVerified(false);
      setAadhaarFile("");
    }
  }

  function addSalesperson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const person: Salesperson = {
      id: Date.now(),
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      mobile: String(formData.get("mobile") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      aadhaarFile,
    };
    setSalespeople((current) => [...current, person]);
    event.currentTarget.reset();
    closeDialog(false);
  }

  const showSalespersonList = workspace === "admin" && page === "salespeople";
  const showReferrals = page === "referrals" || page === "my-owners";
  const showCommission = page === "commission-review" || page === "commissions";
  const showPayouts = page === "payouts";
  const pageIsTable = showSalespersonList || showReferrals || showCommission || showPayouts;
  const resultsCount = showSalespersonList ? filteredSalespeople.length : 0;

  return (
    <div className="min-h-screen bg-background text-foreground md:grid md:grid-cols-[258px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-portal-sidebar px-4 py-6 text-portal-sidebar-foreground md:flex">
        <Brand />
        <p className="mb-4 mt-14 px-3 font-mono text-xs text-portal-sidebar-muted">SALES COMMAND CENTRE</p>
        <nav aria-label={`${workspace} navigation`} className="flex flex-col gap-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => setPage(item.id)}
                aria-current={active ? "page" : undefined}
                className={`h-12 w-full justify-start gap-3 rounded-md px-3 text-sm ${active ? "bg-portal-nav-active text-foreground hover:bg-portal-nav-active" : "text-portal-sidebar-foreground hover:bg-portal-sidebar-hover hover:text-portal-sidebar-foreground"}`}
              >
                <Icon className="size-[19px]" />
                <span className="flex-1 text-left">{item.label}</span>
                {active && <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />}
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto px-3 pt-8 text-xs text-portal-sidebar-muted">Nestni sales portal</div>
      </aside>

      <div className="min-w-0">
        <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 sm:px-8 lg:px-10">
          <div>
            <p className="font-mono text-xs tracking-wide text-primary">{workspace === "admin" ? "ADMINISTRATION" : "SALES PORTAL"}</p>
            <p className="mt-1 text-base font-semibold">Good morning, {workspace === "admin" ? "Nestni" : "Salesperson"}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground sm:flex">
              <span className="size-2 rounded-full bg-portal-success" /> Preview mode
            </span>
            <div aria-label="Choose interface preview" className="flex items-center gap-1 rounded-md bg-muted p-1">
              <Button size="sm" variant={workspace === "salesperson" ? "default" : "ghost"} onClick={() => selectWorkspace("salesperson")}>Salesperson</Button>
              <Button size="sm" variant={workspace === "admin" ? "default" : "ghost"} onClick={() => selectWorkspace("admin")}>Admin</Button>
            </div>
            <span className="grid size-9 place-items-center rounded-full bg-portal-avatar text-sm font-semibold text-portal-avatar-foreground">{workspace === "admin" ? "N" : "S"}</span>
          </div>
          <nav aria-label="Mobile navigation" className="flex w-full gap-1 overflow-x-auto pb-1 md:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <Button key={item.id} size="sm" variant={active ? "secondary" : "ghost"} onClick={() => setPage(item.id)} aria-current={active ? "page" : undefined} className="shrink-0 gap-1.5">
                  <Icon className="size-4" />{item.label}
                </Button>
              );
            })}
          </nav>
        </header>

        <main className="min-h-[calc(100vh-80px)] bg-muted/45 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="mx-auto max-w-[1520px]">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="font-mono text-xs tracking-wide text-muted-foreground">{currentPage.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{page === "overview" && workspace === "salesperson" ? "Your Info" : currentPage.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{workspace === "salesperson" && page === "overview" ? "Your latest activity and commission performance, in one place." : currentPage.description}</p>
              </div>
              {showSalespersonList && (
                <Button onClick={() => closeDialog(true)} className="h-12 gap-2 px-5 shadow-sm">
                  <Plus className="size-4" /> Add salesperson
                </Button>
              )}
              {showReferrals && <span className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">0 owners</span>}
            </div>

            {page === "overview" ? (
              <Overview workspace={workspace} salespersonCount={salespeople.length} onOpenSalespeople={() => setPage("salespeople")} />
            ) : showSalespersonList ? (
              <DataTable
                searchLabel="Search salespeople..."
                count={resultsCount}
                headers={["Salesperson", "Mobile", "City", "Aadhaar card", "Status"]}
                onSearch={setSearchValue}
                emptyTitle={salespeople.length === 0 ? "No salespeople yet" : "No matching salespeople"}
                emptyDescription={salespeople.length === 0 ? "New team members will show up here." : "Try another name, number, or city."}
              >
                {filteredSalespeople.map((person) => (
                  <tr key={person.id} className="border-t border-border">
                    <td className="px-5 py-4"><span className="block font-medium">{person.name}</span><span className="mt-1 block text-xs text-muted-foreground">{person.email}</span></td>
                    <td className="px-5 py-4">+91 {person.mobile}</td>
                    <td className="px-5 py-4">{person.city || "—"}</td>
                    <td className="px-5 py-4">{person.aadhaarFile || "—"}</td>
                    <td className="px-5 py-4"><StatusPill label="ACTIVE" /></td>
                  </tr>
                ))}
              </DataTable>
            ) : showReferrals ? (
              <DataTable
                searchLabel="Search owners..."
                count={0}
                headers={["Owner", "Mobile", "Referral date", "Status", "City"]}
                emptyTitle="No records yet"
                emptyDescription="New activity will show up here."
              />
            ) : showCommission ? (
              <DataTable
                searchLabel="Search commissions..."
                count={0}
                headers={["Activity", "Salesperson", "Generated", "Amount", "Status", "Action"]}
                emptyTitle="No records yet"
                emptyDescription="New activity will show up here."
              />
            ) : showPayouts ? (
              <DataTable
                searchLabel="Search payouts..."
                count={0}
                headers={["Reference", "Salesperson", "Amount", "Method", "Status"]}
                emptyTitle="No records yet"
                emptyDescription="New activity will show up here."
              />
            ) : (
              <ProfilePanel workspace={workspace} />
            )}
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[92vh] overflow-y-auto rounded-lg p-6 sm:max-w-[560px] sm:p-8">
          <DialogHeader className="pr-8 text-left">
            <p className="font-mono text-xs tracking-wide text-primary">TEAM MANAGEMENT</p>
            <DialogTitle className="pt-3 text-2xl font-medium">Add a salesperson.</DialogTitle>
            <DialogDescription className="pt-1">Enter their contact details and Aadhaar card.</DialogDescription>
          </DialogHeader>
          <form className="mt-2 space-y-4" onSubmit={addSalesperson}>
            <Field label="Full name"><Input name="name" placeholder="Full name" autoComplete="name" required /></Field>
            <Field label="Email address"><Input name="email" type="email" placeholder="name@example.com" autoComplete="email" required /></Field>
            <Field label="Mobile number">
              <div className="flex gap-2">
                <Input name="mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} placeholder="10-digit mobile number" value={mobile} onChange={(event) => { setMobile(event.target.value.replace(/\D/g, "")); setNumberVerified(false); }} required />
                <Button type="button" variant="outline" disabled={mobile.length !== 10} onClick={() => setNumberVerified(true)} className="shrink-0 gap-2">
                  {numberVerified ? <Check className="size-4" /> : <Smartphone className="size-4" />}{numberVerified ? "Verified (demo)" : "Verify number"}
                </Button>
              </div>
              <span className="mt-1.5 block text-xs text-muted-foreground">Preview only; no verification message will be sent.</span>
            </Field>
            <Field label="City"><Input name="city" placeholder="City" autoComplete="address-level2" /></Field>
            <Field label="Aadhaar card">
              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground"><Upload className="size-4 shrink-0" /><span className="truncate">{aadhaarFile || "Upload Aadhaar card"}</span></span>
                <span className="shrink-0 text-xs text-primary">Choose file</span>
                <input className="sr-only" type="file" accept="image/png,image/jpeg,application/pdf" onChange={(event) => setAadhaarFile(event.target.files?.[0]?.name ?? "")} />
              </label>
              <span className="mt-1.5 block text-xs text-muted-foreground">PDF, JPG or PNG. Preview only; the file is not uploaded.</span>
            </Field>
            <Button type="submit" className="mt-2 h-12 w-full gap-2">Add salesperson <ChevronRight className="size-4" /></Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="grid size-9 place-items-center rounded-md bg-primary text-base font-bold text-primary-foreground">N</span>
      <span className="text-xl font-semibold tracking-tight text-portal-brand">nestni</span>
    </div>
  );
}

function Overview({ workspace, salespersonCount, onOpenSalespeople }: { workspace: Workspace; salespersonCount: number; onOpenSalespeople: () => void }) {
  const cards = workspace === "admin" ? adminCards : salesCards;
  return (
    <>
      <section aria-label="Summary" className={`grid gap-4 ${workspace === "admin" ? "sm:grid-cols-2 xl:grid-cols-4" : "sm:grid-cols-3"}`}>
        {cards.map((card) => {
          const Icon = card.icon;
          const value = workspace === "admin" && card.label === "Salespeople" ? String(salespersonCount) : card.value;
          return (
            <article key={card.label} className={`min-h-48 rounded-lg border border-border border-t-[3px] bg-card p-5 shadow-sm ${card.tone === "orange" ? "border-t-portal-orange" : card.tone === "blue" ? "border-t-portal-blue" : card.tone === "green" ? "border-t-portal-success" : "border-t-foreground"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-primary"><Icon className="size-[18px]" /></span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-3 text-sm text-muted-foreground">{card.note}</p>
            </article>
          );
        })}
      </section>
      <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <section className="min-h-72 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">PERFORMANCE</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">{workspace === "admin" ? "Commission generated" : "Owner acquisition"}</h2>
            <Button variant="outline" size="sm">Last 6 months</Button>
          </div>
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <Activity className="size-6 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Performance will appear here.</p>
          </div>
        </section>
        <section className="min-h-72 rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="font-mono text-xs tracking-wide text-muted-foreground">RECENT ACTIVITY</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Latest updates</h2>
            {workspace === "admin" && salespersonCount > 0 && <button type="button" onClick={onOpenSalespeople} className="inline-flex items-center gap-1 text-xs text-primary">View team <ArrowUpRight className="size-3.5" /></button>}
          </div>
          <div className="flex min-h-48 flex-col items-center justify-center text-center">
            <ClipboardList className="size-6 text-muted-foreground/60" />
            <p className="mt-2 text-sm font-medium">No referrals yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Owner activity will appear here.</p>
          </div>
        </section>
      </div>
    </>
  );
}

function DataTable({
  searchLabel,
  count,
  headers,
  emptyTitle,
  emptyDescription,
  onSearch,
  children,
}: {
  searchLabel: string;
  count: number;
  headers: string[];
  emptyTitle: string;
  emptyDescription: string;
  onSearch?: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="relative w-full max-w-[300px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label={searchLabel} placeholder={searchLabel} onChange={(event) => onSearch?.(event.target.value)} className="h-10 pl-9" />
        </div>
        <span className="text-xs text-muted-foreground">{count} {count === 1 ? "record" : "records"}</span>
      </div>
      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-muted/75">
            <tr>{headers.map((header) => <th key={header} className="px-5 py-3 font-mono text-[10px] font-normal tracking-wide text-muted-foreground">{header.toUpperCase()}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {count === 0 && (
        <div className="flex min-h-60 flex-col items-center justify-center px-5 py-10 text-center">
          <FileText className="size-7 text-muted-foreground/60" />
          <p className="mt-3 text-sm font-medium">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
      )}
    </section>
  );
}

function ProfilePanel({ workspace }: { workspace: Workspace }) {
  return (
    <section className="max-w-3xl rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="grid size-11 place-items-center rounded-md bg-accent text-primary"><MapPin className="size-5" /></div>
      <h2 className="mt-5 text-lg font-medium">{workspace === "salesperson" ? "Salesperson profile" : "Team details"}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{workspace === "salesperson" ? "Profile information will appear here." : "Administration profile information will appear here."}</p>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>;
}

function StatusPill({ label }: { label: string }) {
  return <span className="inline-flex rounded-sm bg-portal-success-soft px-2 py-1 font-mono text-[10px] tracking-wide text-portal-success-foreground">{label}</span>;
}