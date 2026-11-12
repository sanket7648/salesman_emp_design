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
type SalesPage = "overview" | "my-owners" | "commissions" | "payouts";
type AdminPage = "overview" | "salespeople" | "referrals" | "commission-review" | "payouts";
type Page = SalesPage | AdminPage;

type OwnerProperty = {
  name: string;
  type: string;
  address: string;
  status: string;
};

type OwnerRecord = {
  name: string;
  mobile: string;
  properties: OwnerProperty[];
};

type Salesperson = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  city: string;
  aadhaarFile: string;
};

type CommissionRecord = {
  id: string;
  activity: string;
  salesperson: string;
  generated: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
};

type PayoutRecord = {
  reference: string;
  salesperson: string;
  amount: number;
  method: "UPI" | "NEFT";
  status: "Processing" | "Paid" | "Failed";
};

const salesNavigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "my-owners", label: "My owners", icon: UsersRound },
  { id: "commissions", label: "Commissions", icon: CircleDollarSign },
  { id: "payouts", label: "Payout history", icon: WalletCards },
] as const;

const adminNavigation = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "salespeople", label: "Salespeople", icon: UsersRound },
  { id: "referrals", label: "All owners", icon: ClipboardList },
  { id: "commission-review", label: "Commission review", icon: CircleDollarSign },
  { id: "payouts", label: "Payouts", icon: WalletCards },
] as const;

const pageCopy: Record<Page, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "OPERATIONS OVERVIEW", title: "Keep the team moving.", description: "A clear view of acquisition, approvals, and payout flow." },
  "my-owners": { eyebrow: "OWNER RELATIONSHIPS", title: "Referral pipeline", description: "Every owner attributed through the Nestni sales team." },
  commissions: { eyebrow: "COMMISSIONS", title: "Commission review", description: "Review generated commissions before they become payable." },
  payouts: { eyebrow: "PAYOUTS", title: "Payout history", description: "Track manual UPI and NEFT payout processing." },
  salespeople: { eyebrow: "TEAM MANAGEMENT", title: "Salespeople", description: "Create and manage the people growing Nestni’s owner network." },
  referrals: { eyebrow: "OWNER RELATIONSHIPS", title: "All owners", description: "Owners referred through the Nestni sales team." },
  "commission-review": { eyebrow: "COMMISSIONS", title: "Commission review", description: "Review generated commissions before they become payable." },
};

const salesCards = [
  { label: "Referred owners", value: "0", note: "Across your pipeline", icon: UsersRound, tone: "neutral" },
  { label: "Pending commission", value: "₹0", note: "Awaiting approval", icon: CircleDollarSign, tone: "orange" },
  { label: "Approved commission", value: "₹0", note: "₹0 paid to date", icon: Banknote, tone: "blue" },
] as const;

const adminCards = [
  { label: "Salespeople", value: "0", note: "0 active today", icon: UsersRound, tone: "neutral" },
  { label: "All owners", value: "0", note: "0 registered", icon: ClipboardList, tone: "orange" },
  { label: "Commission generated", value: "₹0", note: "0 awaiting review", icon: CircleDollarSign, tone: "green" },
  { label: "Payouts processed", value: "₹0", note: "Manual payouts", icon: WalletCards, tone: "blue" },
] as const;

const sampleOwners: OwnerRecord[] = [
  {
    name: "Sample Owner",
    mobile: "0000000001",
    properties: [
      { name: "Sample Property 1", type: "2 BHK Apartment", address: "Indiranagar, Bengaluru", status: "Available" },
      { name: "Sample Property 2", type: "1 BHK Apartment", address: "Whitefield, Bengaluru", status: "Under review" },
    ],
  },
];

const sampleCommissions: CommissionRecord[] = [
  { id: "COM-1042", activity: "Indiranagar property referral", salesperson: "Aarav Sharma", generated: "12 Nov 2026", amount: 12500, status: "Pending" },
  { id: "COM-1038", activity: "Whitefield property referral", salesperson: "Aarav Sharma", generated: "10 Nov 2026", amount: 8500, status: "Approved" },
  { id: "COM-1031", activity: "Koramangala property referral", salesperson: "Maya Patel", generated: "08 Nov 2026", amount: 15000, status: "Pending" },
  { id: "COM-1024", activity: "Jubilee Hills property referral", salesperson: "Maya Patel", generated: "05 Nov 2026", amount: 7000, status: "Rejected" },
];

const samplePayouts: PayoutRecord[] = [
  { reference: "PAY-2081", salesperson: "Aarav Sharma", amount: 8500, method: "UPI", status: "Paid" },
  { reference: "PAY-2076", salesperson: "Aarav Sharma", amount: 5000, method: "NEFT", status: "Processing" },
  { reference: "PAY-2069", salesperson: "Maya Patel", amount: 12000, method: "NEFT", status: "Paid" },
  { reference: "PAY-2062", salesperson: "Maya Patel", amount: 3000, method: "UPI", status: "Failed" },
];

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function SalesPortal() {
  const [workspace, setWorkspace] = useState<Workspace>("salesperson");
  const [page, setPage] = useState<Page>("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [commissionStatusFilter, setCommissionStatusFilter] = useState("all");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("all");
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

  const visibleCommissions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return sampleCommissions.filter((commission) => {
      const matchesStatus = commissionStatusFilter === "all" || commission.status === commissionStatusFilter;
      const matchesSearch = [commission.id, commission.activity, commission.salesperson, commission.generated, commission.status]
        .some((value) => value.toLowerCase().includes(query));
      const matchesSalesperson = workspace === "admin" || commission.salesperson === "Aarav Sharma";
      return matchesStatus && matchesSearch && matchesSalesperson;
    });
  }, [commissionStatusFilter, searchValue, workspace]);

  const visiblePayouts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return samplePayouts.filter((payout) => {
      const matchesStatus = payoutStatusFilter === "all" || payout.status === payoutStatusFilter;
      const matchesSearch = [payout.reference, payout.salesperson, payout.method, payout.status]
        .some((value) => value.toLowerCase().includes(query));
      const matchesSalesperson = workspace === "admin" || payout.salesperson === "Aarav Sharma";
      return matchesStatus && matchesSearch && matchesSalesperson;
    });
  }, [payoutStatusFilter, searchValue, workspace]);

  function selectWorkspace(next: Workspace) {
    setWorkspace(next);
    setPage("overview");
    setSearchValue("");
  }

  function navigateToPage(nextPage: Page) {
    setPage(nextPage);
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
  const resultsCount = showSalespersonList ? filteredSalespeople.length : showCommission ? visibleCommissions.length : showPayouts ? visiblePayouts.length : 0;

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
                onClick={() => navigateToPage(item.id)}
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
                <Button key={item.id} size="sm" variant={active ? "secondary" : "ghost"} onClick={() => navigateToPage(item.id)} aria-current={active ? "page" : undefined} className="shrink-0 gap-1.5">
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
                <h1 className="mt-3 text-3xl font-medium tracking-tight sm:text-4xl">{page === "overview" && workspace === "salesperson" ? "Sales dashboard" : currentPage.title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{workspace === "salesperson" && page === "overview" ? "Your latest activity and commission performance, in one place." : currentPage.description}</p>
              </div>
              {showSalespersonList && (
                <Button onClick={() => closeDialog(true)} className="h-12 gap-2 px-5 shadow-sm">
                  <Plus className="size-4" /> Add salesperson
                </Button>
              )}
              {workspace === "salesperson" && page === "overview" && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Quick Search"
                  title="Quick Search"
                  onClick={() => setQuickSearchOpen(true)}
                >
                  <Search aria-hidden="true" className="size-4" />
                </Button>
              )}
              {showReferrals && <span className="rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">0 owners</span>}
            </div>

            {page === "overview" ? (
              <Overview workspace={workspace} salespersonCount={salespeople.length} onOpenSalespeople={() => navigateToPage("salespeople")} />
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
                count={visibleCommissions.length}
                headers={["Activity", "Salesperson", "Generated", "Amount", "Status", "Action"]}
                filterLabel="Filter commissions by status"
                filterValue={commissionStatusFilter}
                filterOptions={["all", "Pending", "Approved", "Rejected"]}
                onFilterChange={setCommissionStatusFilter}
                onSearch={setSearchValue}
                emptyTitle="No matching commissions"
                emptyDescription="Try changing the search or status filter."
              >
                {visibleCommissions.map((commission) => (
                  <tr key={commission.id} className="border-t border-border">
                    <td className="px-5 py-4">{commission.activity}</td>
                    <td className="px-5 py-4">{workspace === "admin" ? commission.salesperson : "You"}</td>
                    <td className="px-5 py-4">{commission.generated}</td>
                    <td className="px-5 py-4">₹{commission.amount.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4"><StatusPill label={commission.status} /></td>
                    <td className="px-5 py-4 text-muted-foreground">{commission.status === "Pending" ? "Review" : "—"}</td>
                  </tr>
                ))}
              </DataTable>
            ) : showPayouts ? (
              <DataTable
                searchLabel="Search payouts..."
                count={visiblePayouts.length}
                headers={["Reference", "Salesperson", "Amount", "Method", "Status"]}
                filterLabel="Filter payouts by status"
                filterValue={payoutStatusFilter}
                filterOptions={["all", "Processing", "Paid", "Failed"]}
                onFilterChange={setPayoutStatusFilter}
                onSearch={setSearchValue}
                emptyTitle="No matching payouts"
                emptyDescription="Try changing the search or status filter."
              >
                {visiblePayouts.map((payout) => (
                  <tr key={payout.reference} className="border-t border-border">
                    <td className="px-5 py-4 font-medium">{payout.reference}</td>
                    <td className="px-5 py-4">{workspace === "admin" ? payout.salesperson : "You"}</td>
                    <td className="px-5 py-4">₹{payout.amount.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-4">{payout.method}</td>
                    <td className="px-5 py-4"><StatusPill label={payout.status} /></td>
                  </tr>
                ))}
              </DataTable>
            ) : null}
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
      <QuickSearchDialog open={quickSearchOpen} onOpenChange={setQuickSearchOpen} />
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
          let value: string = card.value;
          let note: string = card.note;
          if (workspace === "admin" && card.label === "Salespeople") value = String(salespersonCount);
          if (card.label === "Commission generated") {
            value = formatRupees(sampleCommissions.reduce((total, commission) => total + commission.amount, 0));
            note = `${sampleCommissions.filter((commission) => commission.status === "Pending").length} awaiting review`;
          }
          if (card.label === "Payouts processed") {
            value = formatRupees(samplePayouts.filter((payout) => payout.status === "Paid").reduce((total, payout) => total + payout.amount, 0));
          }
          if (card.label === "Pending commission") {
            value = formatRupees(sampleCommissions.filter((commission) => commission.salesperson === "Aarav Sharma" && commission.status === "Pending").reduce((total, commission) => total + commission.amount, 0));
          }
          if (card.label === "Approved commission") {
            value = formatRupees(sampleCommissions.filter((commission) => commission.salesperson === "Aarav Sharma" && commission.status === "Approved").reduce((total, commission) => total + commission.amount, 0));
            note = `${formatRupees(samplePayouts.filter((payout) => payout.salesperson === "Aarav Sharma" && payout.status === "Paid").reduce((total, payout) => total + payout.amount, 0))} paid to date`;
          }
          return (
            <article key={card.label} className={`min-h-48 rounded-lg border border-border border-t-[3px] bg-card p-5 shadow-sm ${card.tone === "orange" ? "border-t-portal-orange" : card.tone === "blue" ? "border-t-portal-blue" : card.tone === "green" ? "border-t-portal-success" : "border-t-foreground"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent text-primary"><Icon className="size-[18px]" /></span>
              </div>
              <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-3 text-sm text-muted-foreground">{note}</p>
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
            <p className="mt-2 text-sm font-medium">{workspace === "admin" ? "No owners yet" : "No referrals yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">Owner activity will appear here.</p>
          </div>
        </section>
      </div>
    </>
  );
}

function QuickSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [ownerSearchNumber, setOwnerSearchNumber] = useState("");
  const [searchedOwner, setSearchedOwner] = useState<OwnerRecord | null>();

  function searchOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchedOwner(sampleOwners.find((owner) => owner.mobile === ownerSearchNumber.trim()) ?? null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-lg p-6 sm:max-w-[560px] sm:p-8">
        <DialogHeader className="pr-8 text-left">
          <DialogTitle className="text-2xl font-medium">Quick Search</DialogTitle>
          <DialogDescription>Find an owner’s properties by their mobile number.</DialogDescription>
        </DialogHeader>
        <form onSubmit={searchOwner} className="space-y-3">
          <Input
            aria-label="Owner mobile number"
            autoComplete="off"
            inputMode="numeric"
            maxLength={10}
            onChange={(event) => {
              setOwnerSearchNumber(event.target.value.replace(/\D/g, ""));
              setSearchedOwner(undefined);
            }}
            pattern="[0-9]{10}"
            placeholder="Enter Number"
            required
            type="tel"
            value={ownerSearchNumber}
          />
          <Button type="submit" className="w-full gap-2">
            <Search aria-hidden="true" className="size-4" />
            Search
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">Preview only. Try sample number 0000000001.</p>
        {searchedOwner === null && (
          <p role="status" className="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
            No owner found for that number.
          </p>
        )}
        {searchedOwner && (
          <div className="border-t border-border pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium">{searchedOwner.name}</h3>
              <span className="text-sm text-muted-foreground">+91 {searchedOwner.mobile}</span>
            </div>
            <h4 className="mt-4 text-sm font-medium">Properties</h4>
            <div className="mt-3 space-y-3">
              {searchedOwner.properties.map((property) => (
                <article key={property.name} className="rounded-md border border-border p-4">
                  <p className="font-medium">{property.name}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Type</dt>
                      <dd className="text-right">{property.type}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="text-right">{property.address}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="text-right">{property.status}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DataTable({
  searchLabel,
  count,
  headers,
  emptyTitle,
  emptyDescription,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  onSearch,
  children,
}: {
  searchLabel: string;
  count: number;
  headers: string[];
  emptyTitle: string;
  emptyDescription: string;
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: string[];
  onFilterChange?: (value: string) => void;
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
        <div className="flex items-center gap-3">
          {filterLabel && filterOptions && onFilterChange && (
            <select
              aria-label={filterLabel}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              onChange={(event) => onFilterChange(event.target.value)}
              value={filterValue}
            >
              {filterOptions.map((option) => (
                <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
              ))}
            </select>
          )}
          <span className="text-xs text-muted-foreground">{count} {count === 1 ? "record" : "records"}</span>
        </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>;
}

function StatusPill({ label }: { label: string }) {
  const tone = label === "Failed" || label === "Rejected"
    ? "bg-destructive/10 text-destructive"
    : label === "Pending" || label === "Processing"
      ? "bg-portal-orange/10 text-primary"
      : "bg-portal-success-soft text-portal-success-foreground";
  return <span className={`inline-flex rounded-sm px-2 py-1 font-mono text-[10px] tracking-wide ${tone}`}>{label.toUpperCase()}</span>;
}