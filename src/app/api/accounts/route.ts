import type { NextRequest } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { collectAccount, getJob } from "@/lib/collector";
import { getAccountByUsername, listAccountsBasic } from "@/lib/queries";
import { fetchAccountVideos, normalizeUsername } from "@/lib/ytdlp";
import type { Account } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ accounts: listAccountsBasic() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
  } | null;
  const username = normalizeUsername(body?.username ?? "");
  if (!username || !/^[a-z0-9._]+$/.test(username)) {
    return Response.json({ error: "Nom de compte invalide" }, { status: 400 });
  }
  if (getAccountByUsername(username)) {
    return Response.json(
      { error: `@${username} est déjà suivi` },
      { status: 409 },
    );
  }
  if (getJob()?.status === "running") {
    return Response.json(
      { error: "Une actualisation est en cours, réessaie dans un instant" },
      { status: 409 },
    );
  }

  let data;
  try {
    data = await fetchAccountVideos(username);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Erreur yt-dlp" },
      { status: 400 },
    );
  }

  const db = getDb();
  const addedAt = nowIso();
  const result = db
    .prepare(
      "INSERT INTO accounts (username, sec_uid, followers, added_at) VALUES (?, ?, NULL, ?)",
    )
    .run(username, data.secUid, addedAt);

  const account: Account = {
    id: Number(result.lastInsertRowid),
    username,
    sec_uid: data.secUid,
    followers: null,
    added_at: addedAt,
    last_collected_at: null,
  };

  try {
    await collectAccount(account, data);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? `Compte ajouté mais collecte échouée : ${error.message}`
            : "Compte ajouté mais collecte échouée",
      },
      { status: 500 },
    );
  }

  return Response.json(
    { account: getAccountByUsername(username) },
    { status: 201 },
  );
}
