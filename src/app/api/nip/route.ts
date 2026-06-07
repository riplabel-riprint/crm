import { NextRequest, NextResponse } from "next/server";
import https from "node:https";

const agent = new https.Agent({ rejectUnauthorized: false });

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { agent }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

export async function GET(request: NextRequest) {
  const nip = request.nextUrl.searchParams.get("nip");
  if (!nip) return NextResponse.json({ error: "Brak NIP" }, { status: 400 });

  const date = new Date().toISOString().split("T")[0];
  try {
    const raw = await httpsGet(
      `https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`
    );
    const data = JSON.parse(raw);
    const subject = data?.result?.subject;

    if (!subject) {
      return NextResponse.json({ error: "Nie znaleziono firmy" }, { status: 404 });
    }

    return NextResponse.json({
      name: subject.name ?? null,
      nip: subject.nip ?? null,
      regon: subject.regon ?? null,
      address: subject.workingAddress ?? subject.residenceAddress ?? null,
      statusVat: subject.statusVat ?? null,
      krs: subject.krs ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Nie znaleziono firmy" }, { status: 404 });
  }
}
