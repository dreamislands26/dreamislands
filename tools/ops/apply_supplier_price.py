#!/usr/bin/env python3
"""Show the partner's own price (e.g. 31,800 CHF, from price_points source='supplier') on the program page,
with the USD amount as an approximation, and use it in the Product JSON-LD offer.
Patches programs/[slug]/{page.tsx,ProgramView.tsx,BookingPanel.tsx}. Idempotent, anchor-checked, backups in /root.
Usage: python3 apply_supplier_price.py /opt/dit-platform/src"""
import pathlib, shutil, sys, time

src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/opt/dit-platform/src")
d = src / "app/(public)/programs/[slug]"
bak = pathlib.Path(f"/root/supplier_price_bak_{time.strftime('%Y%m%d_%H%M%S')}")
bak.mkdir(parents=True, exist_ok=True)


def patch(name, edits):
    f = d / name
    t = f.read_text(encoding="utf-8")
    if "supplierPrice" in t:
        print("skip (already patched):", name)
        return
    for old, new in edits:
        if t.count(old) != 1:
            sys.exit(f"ANCHOR PROBLEM in {name} (found {t.count(old)}): {old[:70]!r}")
    shutil.copy2(f, bak / name)
    for old, new in edits:
        t = t.replace(old, new)
    f.write_text(t, encoding="utf-8")
    print("patched:", name)


patch("page.tsx", [
    ('  const activeVariants = (program.program_variants ?? []).filter((v) => v.active)\n',
     '  // Partner-quoted price (e.g. CHF), kept in price_points with source=supplier; USD on the site is derived from it.\n'
     '  const { data: spRow } = await supabaseAdmin\n'
     '    .from("price_points")\n'
     '    .select("amount, currency")\n'
     '    .eq("entity_type", "program")\n'
     '    .eq("entity_id", program.id)\n'
     '    .eq("tier", "base")\n'
     '    .eq("source", "supplier")\n'
     '    .maybeSingle()\n'
     '  const supplierPrice = spRow ? { amount: Number((spRow as any).amount), currency: String((spRow as any).currency) } : null\n'
     '  const activeVariants = (program.program_variants ?? []).filter((v) => v.active)\n'),
    ('            priceCurrency: "USD",\n            price: lowestPrice,',
     '            priceCurrency: supplierPrice?.currency ?? "USD",\n            price: supplierPrice?.amount ?? lowestPrice,'),
    ('galleryImages={galleryImages} reviews={reviewsForView} related={related} />',
     'galleryImages={galleryImages} reviews={reviewsForView} related={related} supplierPrice={supplierPrice} />'),
])

patch("ProgramView.tsx", [
    ('  reviews,\n  related,\n}: {', '  reviews,\n  related,\n  supplierPrice,\n}: {'),
    ('  related: CatalogProgram[]\n}) {', '  related: CatalogProgram[]\n  supplierPrice?: { amount: number; currency: string } | null\n}) {'),
    ('            waHref={waHref}\n          />', '            waHref={waHref}\n            supplierPrice={supplierPrice}\n          />'),
])

patch("BookingPanel.tsx", [
    ('  variants,\n  waHref,\n  placeLine,\n}: {', '  variants,\n  waHref,\n  placeLine,\n  supplierPrice,\n}: {'),
    ('  waHref: string\n  placeLine?: string\n}) {\n  const router = useRouter()',
     '  waHref: string\n  placeLine?: string\n  supplierPrice?: { amount: number; currency: string } | null\n}) {\n  const router = useRouter()'),
    ('  const price = v?.price_basic_usd ?? 0\n',
     '  const price = v?.price_basic_usd ?? 0\n'
     '  const fmtSup = (n: number) => `${supplierPrice!.currency} ${Math.round(n).toLocaleString("en-US")}`\n'
     '  const sup = supplierPrice ? fmtSup(supplierPrice.amount) : null\n'),
    ('            <span className="ds-headline-s">{hasUsd ? `From ${usd(Math.min(...variants.map((x) => x.price_basic_usd).filter((n) => n > 0)))}` : "Price on request"}</span>',
     '            <span className="ds-headline-s">{sup ? `From ${sup}` : hasUsd ? `From ${usd(Math.min(...variants.map((x) => x.price_basic_usd).filter((n) => n > 0)))}` : "Price on request"}</span>'),
    ('<span className="ds-body-m ds-muted"><Facts items={[hasUsd ? "per person" : null, `${days} days`]} /></span>\n          </div>\n',
     '<span className="ds-body-m ds-muted"><Facts items={[hasUsd ? "per person" : null, `${days} days`]} /></span>\n          </div>\n'
     '          {sup && price > 0 && <p className="ds-body-m ds-muted" style={{ margin: 0 }}>About {usd(price)} at today&apos;s exchange rate. Your coordinator confirms the final price.</p>}\n'),
    ('<div className={o.sumRow}><span>Programme, {days} days</span><span>{usd(price)}</span></div>',
     '<div className={o.sumRow}><span>Programme, {days} days</span><span>{sup ?? usd(price)}</span></div>'),
    ('<span>{usd(price * pax)}</span></div>',
     '<span>{supplierPrice ? fmtSup(supplierPrice.amount * pax) : usd(price * pax)}</span></div>'),
    ('<strong>{price > 0 ? usd(price) : "On request"}</strong>',
     '<strong>{sup ? `from ${sup}` : price > 0 ? usd(price) : "On request"}</strong>'),
])
print("backup in", bak)
