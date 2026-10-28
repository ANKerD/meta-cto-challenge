import type { DatabaseSync } from "node:sqlite";

export function getVoteStats(db: DatabaseSync, since: string, until: string) {
  const rows = db.prepare(`
    SELECT t.id, t.uuid, t.title, t.description, t.status,
      COUNT(v.username) AS total_votes,
      COUNT(CASE WHEN v.voted_at >= ? AND v.voted_at < ? THEN 1 END) AS recent_votes,
      COUNT(CASE WHEN v.username IS NOT NULL AND v.voted_at IS NULL THEN 1 END) AS unknown_vote_times
    FROM tickets t LEFT JOIN ticket_votes v ON v.ticket_id = t.id
    GROUP BY t.id
  `).all(since, until);

  return {
    tickets: rows.map((row) => ({
      id: Number(row.id),
      uuid: String(row.uuid),
      title: String(row.title),
      description: String(row.description),
      status: String(row.status),
      recentVotes: Number(row.recent_votes),
      totalVotes: Number(row.total_votes),
    })),
    unknownVoteTimes: rows.reduce((total, row) => total + Number(row.unknown_vote_times), 0),
  };
}
